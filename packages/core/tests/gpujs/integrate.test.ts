import { expect, it } from 'vitest';

import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#src/gpujs/layout.js';

it('maps motion and lifetime texels without changing the behavior math', () => {
  const state: ParticleTexture = [[[10, 20, 30, -40]], [[0.5, 2, 1, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () => integrate.call(context, state, 0.1, 0, 0, 0, 0, 100, 0, 1, 100, 2, 1, 0, 0);
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
  const step = () => integrate.call(context, state, 0.1, 0, 1, 5, 6, 220, 0, 0, 100, 3, 1, 0, 0);
  expect(step()).toEqual([5, 6, 220, 0]);
  context.thread.y = 1;
  expect(step()).toEqual([0, 3, 1, 0]);
});

it('preserves birth lifetime and stops motion at expiry despite new initial parameters', () => {
  const state: ParticleTexture = [[[10, 20, 30, -40]], [[2, 2, 1, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () => integrate.call(context, state, 0.1, 0, 0, 5, 6, 999, 0, 0, -100, 10, 1, 0, 0);
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
  const first = integrate.call(context, state, 0.1, 0, 1, 5, 6, 220, 0, 0, 100, 3, 1, 1, 100);
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
  );
  expect(changedPointDirection).toEqual(first);
  expect(Math.hypot(first[0] - 5, first[1] - 6)).toBeLessThanOrEqual(50);
  expect(Math.hypot(first[2], first[3])).toBeCloseTo(220);
});
