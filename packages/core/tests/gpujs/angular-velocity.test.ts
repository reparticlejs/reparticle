import { expect, it } from 'vitest';

import { propertyVariation } from '#src/behaviors/property-variation.js';
import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('captures spread once, accumulates spin, and resets on slot reuse', () => {
  const state: ParticleTexture = [
    [[0, 0, 0, 0]],
    [[0, 2, 24, 0]],
    [[1, 1, 1, 1]],
    [[0, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 3 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const curve = new Float32Array(65).fill(1);
  let spawning = 1;
  let speed = 100;
  let mode = 1;
  const run = (seed: number) =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      spawning,
      0,
      0,
      0,
      0,
      0,
      10,
      seed,
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
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      new Float32Array(65),
      0,
      speed,
      40,
      curve,
      mode,
      0,
      0,
      0,
      0,
      new Float32Array([2, 0, 0, 100, 40, 0, 0, 0.6, -0.8, 0, 0, 1, 2, 2, 0, 0, 1, 0, 0, 0]),
    );
  const born = run(1);
  const captured = 100 + 40 * propertyVariation(0, 1, 15);
  expect(born[1]).toBeCloseTo(captured);
  expect(born[2]).toBeCloseTo(captured * 0.1);
  state[3]![0] = born;
  spawning = 0;
  speed = 500;
  const next = run(99);
  expect(next[1]).toBeCloseTo(captured);
  expect(next[2]).toBeCloseTo(captured * 0.2);
  state[1]![0]![0] = 3;
  expect(run(99)).toEqual(born);
  spawning = 1;
  expect(run(99)[1]).toBeCloseTo(500 + 40 * propertyVariation(0, 99, 15));
  mode = 0;
  expect(run(99)[2]).toBe(0);
});
