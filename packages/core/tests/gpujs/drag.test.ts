import { expect, it } from 'vitest';

import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('retains spread for the lifetime, resamples on birth, and damps after gravity', () => {
  const state: ParticleTexture = [
    [[0, 0, 100, 50]],
    [[0, 10, 24, 0]],
    [[1, 1, 1, 1]],
    [[0.5, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const run = (spawn: number, seed: number, directional: number) =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      spawn,
      0,
      0,
      100,
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
      directional,
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      new Float32Array(65),
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
      new Float32Array(65).fill(1),
      0,
      0,
      0,
      0,
      0,
      new Float32Array(24),
    );
  expect(run(0, 1, 0).slice(2)).toEqual([70, 42]);
  expect(run(0, 99, 0).slice(2)).toEqual([70, 42]);
  expect(run(0, 1, 1).slice(2)).toEqual([70, 60]);
  context.thread.y = 3;
  expect(run(0, 99, 0)).toEqual([0.5, 0, 0, 0]);
  expect(run(1, 1, 0)).not.toEqual(run(1, 2, 0));
});
