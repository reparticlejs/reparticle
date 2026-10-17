import { expect, it } from 'vitest';

import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('maps motion and properties texels without changing the behavior math', () => {
  const state: ParticleTexture = [[[10, 20, 30, -40]], [[0.5, 2, 1, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      0,
      0,
      0,
      100,
      0,
      1,
      100,
      2,
      1,
      0,
      0,
      0,
      24,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  expect(step()).toEqual([13, 16.5, 30, -30]);
  context.thread.y = 1;
  expect(step()).toEqual([0.6, 2, 1, 0]);
  context.thread.y = 0;
  state[1]![0]![0] = 3;
  expect(step()).toEqual([10, 20, 0, 0]);
});

it('reinitializes a recycled slot without applying motion or aging on its birth step', () => {
  const state: ParticleTexture = [[[99, 88, 77, 66]], [[10, 2, 1, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      1,
      5,
      6,
      220,
      0,
      0,
      100,
      3,
      1,
      0,
      0,
      0,
      24,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  expect(step()).toEqual([5, 6, 220, 0]);
  context.thread.y = 1;
  expect(step()).toEqual([0, 3, 24, 0]);
});

it('preserves lifetime captured at spawn and stops motion at expiry despite new initial parameters', () => {
  const state: ParticleTexture = [[[10, 20, 30, -40]], [[2, 2, 1, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      0,
      5,
      6,
      999,
      0,
      0,
      -100,
      10,
      1,
      0,
      0,
      0,
      24,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  expect(step()).toEqual([10, 20, 0, 0]);
  context.thread.y = 1;
  expect(step()).toEqual([2.1, 2, 1, 0]);
});

it('uses radial circle spawning independently of point direction and spread', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0, 0, 0, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const first = integrate.call(
    context,
    state,
    0.1,
    0,
    1,
    5,
    6,
    220,
    0,
    0,
    100,
    3,
    1,
    1,
    100,
    0,
    24,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  );
  const changedPointDirection = integrate.call(
    context,
    state,
    0.1,
    0,
    1,
    5,
    6,
    220,
    2,
    10,
    100,
    3,
    1,
    1,
    100,
    0,
    24,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  );
  expect(changedPointDirection).toEqual(first);
  expect(Math.hypot(first[0] - 5, first[1] - 6)).toBeLessThanOrEqual(50);
  expect(Math.hypot(first[2], first[3])).toBeCloseTo(220);
});

it('spawns a cone independently of point direction and keeps birth age at zero', () => {
  const state: ParticleTexture = [[[99, 88, 77, 66]], [[10, 2, 1, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = (direction: number, spread: number) =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      1,
      10,
      20,
      220,
      direction,
      spread,
      100,
      3,
      17,
      3,
      200,
      100,
      24,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  const born = step(0, 0);
  expect(step(2, 10)).toEqual(born);
  expect(born[1]).toBeLessThan(20);
  expect(Math.hypot(born[2], born[3])).toBeCloseTo(220);
  context.thread.y = 1;
  expect(step(0, 0)).toEqual([0, 3, 24, 0]);
});

it('captures size at birth, preserves it when initial size changes, and replaces it on reuse', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0.2, 2, 12, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 1 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const retained = integrate.call(
    context,
    state,
    0.1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    1,
    0,
    0,
    0,
    48,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  );
  expect(retained[2]).toBe(12);
  const recycled = integrate.call(
    context,
    state,
    0.1,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    1,
    0,
    0,
    0,
    48,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  );
  expect(recycled).toEqual([0, 2, 48, 0]);
});

it('preserves initial alpha until the slot is recycled', () => {
  const state: ParticleTexture = [[[0, 0, 10, 0]], [[0.2, 2, 24, 0]], [[1, 1, 1, 0.25]]];
  const context: KernelContext = {
    thread: { x: 0, y: 2 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const retained = integrate.call(
    context,
    state,
    0.1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    1,
    0,
    0,
    0,
    24,
    0.75,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  );
  expect(retained[3]).toBe(0.25);
  const recycled = integrate.call(
    context,
    state,
    0.1,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    2,
    1,
    0,
    0,
    0,
    24,
    0.75,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  );
  expect(recycled).toEqual([1, 1, 1, 0.75]);
});

it('continues simulating transparent particles and keeps unused slots inactive', () => {
  const state: ParticleTexture = [[[0, 0, 10, 0]], [[0.2, 2, 24, 0]], [[1, 1, 1, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      1,
      0,
      0,
      0,
      24,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  expect(step()).toEqual([1, 0, 10, 0]);
  state[1]![0] = [0, 0, 0, 0];
  expect(step()).toEqual([0, 0, 0, 0]);
});

it('captures initial RGB, preserves it, and replaces it when a slot is reused', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0.2, 2, 24, 0]], [[0.1, 0.2, 0.3, 0.5]]];
  const context: KernelContext = {
    thread: { x: 0, y: 2 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = (spawn: number) =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      spawn,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      1,
      0,
      0,
      0,
      24,
      1,
      0.7,
      0.8,
      0.9,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  expect(step(0)).toEqual([0.1, 0.2, 0.3, 0.5]);
  expect(step(1)).toEqual([0.7, 0.8, 0.9, 1]);
  context.thread.y = 1;
  expect(step(0)).toEqual([expect.closeTo(0.3), 2, 24, 0]);
});

it('captures initial rotation and preserves it until slot reuse', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0.2, 2, 24, -45]], [[1, 1, 1, 1]]];
  const context: KernelContext = {
    thread: { x: 0, y: 1 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = (spawn: number) =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      spawn,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      1,
      0,
      0,
      0,
      24,
      1,
      1,
      1,
      1,
      450,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  expect(step(0)[3]).toBe(-45);
  expect(step(1)).toEqual([0, 2, 24, 450]);
});

it('captures alignment at zero speed, adds initial rotation, and retains it under gravity', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0, 0, 0, 0]], [[1, 1, 1, 1]]];
  const context: KernelContext = {
    thread: { x: 0, y: 1 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = (spawn: number) =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      spawn,
      0,
      0,
      0,
      0,
      0,
      160,
      2,
      1,
      0,
      0,
      0,
      24,
      1,
      1,
      1,
      1,
      30,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
  const born = step(1);
  expect(born).toEqual([0, 2, 24, -60]);
  state[1]![0] = born;
  expect(step(0)[3]).toBe(-60);
  context.thread.y = 0;
  expect(step(0)[3]).toBe(16);
});
