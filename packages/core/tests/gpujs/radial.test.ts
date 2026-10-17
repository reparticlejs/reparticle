import { expect, it } from 'vitest';

import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('applies radial after drag with stable spread and integrates its displacement once', () => {
  const state: ParticleTexture = [
    [[3, 4, 100, 50]],
    [[0, 10, 24, 0]],
    [[1, 1, 1, 1]],
    [[0.5, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const run = (seed: number) =>
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
      100,
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
      2,
      2,
      0,
      1,
      0,
      40,
      0.6,
      -0.8,
      100,
      40,
      0,
      0,
      5,
      new Float32Array(65),
      0,
    );
  expect(run(1)[2]).toBeCloseTo((100 + 120 * 0.6 * 0.1) * 0.7 + 7.2);
  expect(run(1)[3]).toBeCloseTo((50 - 120 * 0.8 * 0.1) * 0.7 + 9.6);
  expect(run(1)[0]).toBeCloseTo(3 + 100 * 0.1 + 0.5 * 72 * 0.01 - 107.2 * 0.3 * 0.1 + 0.72);
  expect(run(1)[1]).toBeCloseTo(4 + 50 * 0.1 - 0.5 * 96 * 0.01 - 40.4 * 0.3 * 0.1 + 0.96);
  expect(run(99)).toEqual(run(1));
});
