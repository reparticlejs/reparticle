import { expect, it } from 'vitest';

import { integrate } from '#src/simulation/kernels/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('maps motion and properties texels without changing the behavior math', () => {
  const state: ParticleTexture = [
    [[10, 20, 30, -40]],
    [[0.5, 2, 1, 0]],
    [[0, 0, 0, 0]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, 0, 1, 0],
      /* emission */ [100, 0, 1, 2],
      /* shape */ [0, 0, 0, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 0, 0, 0],
      /* color */ [1, 1, 1, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [0, 0, 0, 0],
      /* position */ [0, 0, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [0, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([1, 0, 0, 100, 0, 0, 0, 0, 1, 0, 0]),
    );
  expect(step()).toEqual([13, 17, 30, -30]);
  context.thread.y = 1;
  expect(step()).toEqual([0.6, 2, 1, 0]);
  context.thread.y = 0;
  state[1]![0]![0] = 1.9;
  expect(step()).toEqual([13, 17, 30, -30]);
  state[1]![0]![0] = 2;
  expect(step()).toEqual([10, 20, 0, 0]);
  state[1]![0]![0] = 3;
  expect(step()).toEqual([10, 20, 0, 0]);
});

it('reinitializes a recycled slot and moves and ages on its birth step', () => {
  const state: ParticleTexture = [
    [[99, 88, 77, 66]],
    [[10, 2, 1, 0]],
    [[0, 0, 0, 0]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  let seconds = 0.1;
  let count = 1;
  let lifetime = 3;
  const step = () =>
    integrate.call(
      context,
      state,
      /* step */ [seconds, count, 1, 0],
      /* emission */ [220, 0, 0, lifetime],
      /* shape */ [0, 0, 0, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 0, 0, 0],
      /* color */ [1, 1, 1, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [0, 0, 0, 0],
      /* position */ [5, 6, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [0, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([1, 0, 0, 100, 0, 0, 0, 0, 1, 0, 0]),
    );
  expect(step()).toEqual([27, 7, 220, 10]);
  context.thread.y = 1;
  expect(step()).toEqual([0.1, 3, 24, 0]);
  // Read every band from the same previous texture, just as the GPU does.
  function tick() {
    const output = state.map((_, row) => {
      context.thread.y = row;
      return [step()];
    });
    state.splice(0, state.length, ...output);
  }
  lifetime = 0.01;
  tick();
  expect(state[3]![0]![0]).toBe(1);
  expect(state[1]![0]![0]).toBeGreaterThan(state[1]![0]![1]);
  const position = state[0]![0]!.slice(0, 2);
  count = 0;
  seconds = 0;
  tick();
  expect(state[3]![0]![0]).toBe(1);
  seconds = 0.1;
  tick();
  expect(state[3]![0]![0]).toBe(0);
  expect(state[0]![0]).toEqual([...position, 0, 0]);
  count = 1;
  tick();
  expect(state[3]![0]![0]).toBe(1);
});

it('preserves lifetime captured at spawn and stops motion at expiry despite new initial parameters', () => {
  const state: ParticleTexture = [
    [[10, 20, 30, -40]],
    [[2, 2, 1, 0]],
    [[0, 0, 0, 0]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, 0, 1, 0],
      /* emission */ [999, 0, 0, 10],
      /* shape */ [0, 0, 0, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 0, 0, 0],
      /* color */ [1, 1, 1, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [0, 0, 0, 0],
      /* position */ [5, 6, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [0, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([1, 0, 0, -100, 0, 0, 0, 0, 1, 0, 0]),
    );
  expect(step()).toEqual([10, 20, 0, 0]);
  context.thread.y = 1;
  expect(step()).toEqual([2.1, 2, 1, 0]);
});

it('uses radial circle spawning independently of point direction and spread', () => {
  const state: ParticleTexture = [
    [[0, 0, 0, 0]],
    [[0, 0, 0, 0]],
    [[0, 0, 0, 0]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const first = integrate.call(
    context,
    state,
    /* step */ [0.1, 1, 1, 0],
    /* emission */ [220, 0, 0, 3],
    /* shape */ [1, 100, 0, 0],
    /* shapeSpread */ [0, 0, 0, 0],
    /* appearance */ [24, 0, 0, 0],
    /* color */ [1, 1, 1, 1],
    /* motionSpread */ [0, 0, 0, 0],
    /* colorSpread */ [0, 0, 0, 0],
    /* geometrySpread */ [0, 0, 0, 0],
    /* position */ [5, 6, 0, 0],
    /* transform */ [1, 0, 1, 1],
    /* orientation */ [0, 0, 0, 0],
    new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
    new Float32Array(65),
    new Float32Array(65).fill(1),
    new Float32Array([1, 0, 0, 100, 0, 0, 0, 0, 1, 0, 0]),
  );
  const changedPointDirection = integrate.call(
    context,
    state,
    /* step */ [0.1, 1, 1, 0],
    /* emission */ [220, 2, 10, 3],
    /* shape */ [1, 100, 0, 0],
    /* shapeSpread */ [0, 0, 0, 0],
    /* appearance */ [24, 0, 0, 0],
    /* color */ [1, 1, 1, 1],
    /* motionSpread */ [0, 0, 0, 0],
    /* colorSpread */ [0, 0, 0, 0],
    /* geometrySpread */ [0, 0, 0, 0],
    /* position */ [5, 6, 0, 0],
    /* transform */ [1, 0, 1, 1],
    /* orientation */ [0, 0, 0, 0],
    new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
    new Float32Array(65),
    new Float32Array(65).fill(1),
    new Float32Array([1, 0, 0, 100, 0, 0, 0, 0, 1, 0, 0]),
  );
  expect(changedPointDirection).toEqual(first);
  // Undo birth-step movement before checking the sampled position's radius.
  const birthX = first[0] - first[2] * 0.1;
  const birthY = first[1] - first[3] * 0.1;
  expect(Math.hypot(birthX - 5, birthY - 6)).toBeLessThanOrEqual(50);
  expect(Math.hypot(first[2], first[3] - 10)).toBeCloseTo(220);
});

it('spawns a cone independently of point direction and advances birth age', () => {
  const state: ParticleTexture = [
    [[99, 88, 77, 66]],
    [[10, 2, 1, 0]],
    [[0, 0, 0, 0]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = (direction: number, spread: number) =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, 1, 17, 0],
      /* emission */ [220, direction, spread, 3],
      /* shape */ [3, 200, 100, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 0, 0, 0],
      /* color */ [1, 1, 1, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [0, 0, 0, 0],
      /* position */ [10, 20, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [0, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([1, 0, 0, 100, 0, 0, 0, 0, 1, 0, 0]),
    );
  const born = step(0, 0);
  expect(step(2, 10)).toEqual(born);
  expect(born[1]).toBeLessThan(20);
  expect(Math.hypot(born[2], born[3] - 10)).toBeCloseTo(220);
  context.thread.y = 1;
  expect(step(0, 0)).toEqual([0.1, 3, 24, 0]);
});

it('captures size at birth, preserves it when initial size changes, and replaces it on reuse', () => {
  const state: ParticleTexture = [
    [[0, 0, 0, 0]],
    [[0.2, 2, 12, 0]],
    [[0, 0, 0, 0]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 1 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const retained = integrate.call(
    context,
    state,
    /* step */ [0.1, 0, 1, 0],
    /* emission */ [0, 0, 0, 2],
    /* shape */ [0, 0, 0, 0],
    /* shapeSpread */ [0, 0, 0, 0],
    /* appearance */ [48, 0, 0, 0],
    /* color */ [1, 1, 1, 1],
    /* motionSpread */ [0, 0, 0, 0],
    /* colorSpread */ [0, 0, 0, 0],
    /* geometrySpread */ [0, 0, 0, 0],
    /* position */ [0, 0, 0, 0],
    /* transform */ [1, 0, 1, 1],
    /* orientation */ [0, 0, 0, 0],
    new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
    new Float32Array(65),
    new Float32Array(65).fill(1),
    new Float32Array([0, 0]),
  );
  expect(retained[2]).toBe(12);
  const recycled = integrate.call(
    context,
    state,
    /* step */ [0.1, 1, 1, 0],
    /* emission */ [0, 0, 0, 2],
    /* shape */ [0, 0, 0, 0],
    /* shapeSpread */ [0, 0, 0, 0],
    /* appearance */ [48, 0, 0, 0],
    /* color */ [1, 1, 1, 1],
    /* motionSpread */ [0, 0, 0, 0],
    /* colorSpread */ [0, 0, 0, 0],
    /* geometrySpread */ [0, 0, 0, 0],
    /* position */ [0, 0, 0, 0],
    /* transform */ [1, 0, 1, 1],
    /* orientation */ [0, 0, 0, 0],
    new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
    new Float32Array(65),
    new Float32Array(65).fill(1),
    new Float32Array([0, 0]),
  );
  expect(recycled).toEqual([0.1, 2, 48, 0]);
});

it('preserves initial alpha until the slot is recycled', () => {
  const state: ParticleTexture = [
    [[0, 0, 10, 0]],
    [[0.2, 2, 24, 0]],
    [[1, 1, 1, 0.25]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 2 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const retained = integrate.call(
    context,
    state,
    /* step */ [0.1, 0, 1, 0],
    /* emission */ [0, 0, 0, 2],
    /* shape */ [0, 0, 0, 0],
    /* shapeSpread */ [0, 0, 0, 0],
    /* appearance */ [24, 0, 0, 0],
    /* color */ [1, 1, 1, 0.75],
    /* motionSpread */ [0, 0, 0, 0],
    /* colorSpread */ [0, 0, 0, 0],
    /* geometrySpread */ [0, 0, 0, 0],
    /* position */ [0, 0, 0, 0],
    /* transform */ [1, 0, 1, 1],
    /* orientation */ [0, 0, 0, 0],
    new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
    new Float32Array(65),
    new Float32Array(65).fill(1),
    new Float32Array([0, 0]),
  );
  expect(retained[3]).toBe(0.25);
  const recycled = integrate.call(
    context,
    state,
    /* step */ [0.1, 1, 1, 0],
    /* emission */ [0, 0, 0, 2],
    /* shape */ [0, 0, 0, 0],
    /* shapeSpread */ [0, 0, 0, 0],
    /* appearance */ [24, 0, 0, 0],
    /* color */ [1, 1, 1, 0.75],
    /* motionSpread */ [0, 0, 0, 0],
    /* colorSpread */ [0, 0, 0, 0],
    /* geometrySpread */ [0, 0, 0, 0],
    /* position */ [0, 0, 0, 0],
    /* transform */ [1, 0, 1, 1],
    /* orientation */ [0, 0, 0, 0],
    new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
    new Float32Array(65),
    new Float32Array(65).fill(1),
    new Float32Array([0, 0]),
  );
  expect(recycled).toEqual([1, 1, 1, 0.75]);
});

it('continues simulating transparent particles and keeps unused slots inactive', () => {
  const state: ParticleTexture = [
    [[0, 0, 10, 0]],
    [[0.2, 2, 24, 0]],
    [[1, 1, 1, 0]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, 0, 1, 0],
      /* emission */ [0, 0, 0, 2],
      /* shape */ [0, 0, 0, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 0, 0, 0],
      /* color */ [1, 1, 1, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [0, 0, 0, 0],
      /* position */ [0, 0, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [0, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([0, 0]),
    );
  expect(step()).toEqual([1, 0, 10, 0]);
  state[1]![0] = [0, 0, 0, 0];
  state[3]![0]![0] = 0;
  expect(step()).toEqual([0, 0, 0, 0]);
});

it('captures initial RGB, preserves it, and replaces it when a slot is reused', () => {
  const state: ParticleTexture = [
    [[0, 0, 0, 0]],
    [[0.2, 2, 24, 0]],
    [[0.1, 0.2, 0.3, 0.5]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 2 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = (spawn: number) =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, spawn, 1, 0],
      /* emission */ [0, 0, 0, 2],
      /* shape */ [0, 0, 0, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 0, 0, 0],
      /* color */ [0.7, 0.8, 0.9, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [0, 0, 0, 0],
      /* position */ [0, 0, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [0, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([0, 0]),
    );
  expect(step(0)).toEqual([0.1, 0.2, 0.3, 0.5]);
  expect(step(1)).toEqual([0.7, 0.8, 0.9, 1]);
  context.thread.y = 1;
  expect(step(0)).toEqual([expect.closeTo(0.3), 2, 24, 0]);
});

it('captures initial rotation and preserves it until slot reuse', () => {
  const state: ParticleTexture = [
    [[0, 0, 0, 0]],
    [[0.2, 2, 24, -45]],
    [[1, 1, 1, 1]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 1 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = (spawn: number) =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, spawn, 1, 0],
      /* emission */ [0, 0, 0, 2],
      /* shape */ [0, 0, 0, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 450, 0, 0],
      /* color */ [1, 1, 1, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [0, 0, 0, 0],
      /* position */ [0, 0, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [0, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([0, 0]),
    );
  expect(step(0)[3]).toBe(-45);
  expect(step(1)).toEqual([0.1, 2, 24, 450]);
});

it('captures alignment at zero speed, adds initial rotation, and retains it under gravity', () => {
  const state: ParticleTexture = [
    [[0, 0, 0, 0]],
    [[0, 0, 0, 0]],
    [[1, 1, 1, 1]],
    [[1, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 1 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = (spawn: number) =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, spawn, 1, 0],
      /* emission */ [0, 0, 0, 2],
      /* shape */ [0, 0, 0, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 30, 0, 0],
      /* color */ [1, 1, 1, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [0, 0, 0, 0],
      /* position */ [0, 0, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [1, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([1, 0, 0, 160, 0, 0, 0, 0, 1, 0, 0]),
    );
  const born = step(1);
  expect(born).toEqual([0.1, 2, 24, -60]);
  state[1]![0] = born;
  expect(step(0)[3]).toBe(-60);
  context.thread.y = 0;
  expect(step(0)[3]).toBe(16);
});
