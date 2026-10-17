import { expect, it } from 'vitest';

import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('adds inherited motion only at birth without changing initial-direction orientation', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0, 10, 24, 0]], [[1, 1, 1, 1]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { rows: 1, width: 1, capacity: 1 },
  };
  const run = (spawn: number, x: number, y: number) =>
    integrate.call(
      context,
      state,
      0,
      0,
      spawn,
      0,
      0,
      10,
      0,
      0,
      0,
      10,
      1,
      2,
      0,
      0,
      24,
      1,
      1,
      1,
      1,
      0,
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
      x,
      y,
      1,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
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
    );
  const base = run(1, 0, 0);
  const inherited = run(1, 100, -50);
  expect(inherited).toEqual([base[0], base[1], base[2] + 100, base[3] - 50]);
  state[0]![0] = inherited;
  expect(run(0, -500, 800)).toEqual(inherited);
  context.thread.y = 1;
  expect(run(1, 100, -50)).toEqual(run(1, 0, 0));
});
