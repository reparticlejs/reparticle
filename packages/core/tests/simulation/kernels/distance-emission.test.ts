import { expect, it } from 'vitest';

import { integrate } from '#src/simulation/kernels/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('places distance births by ordinal across sparse slots and leaves other births at the origin', () => {
  const state: ParticleTexture = Array.from({ length: 5 }, () =>
    Array.from({ length: 48 }, () => [0, 0, 0, 0]),
  );
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 48, rows: 1, capacity: 48 },
  };
  // Slots 0, 23, 24, 30; prefixes count births before each group of 24 slots.
  const mask = new Float32Array([1 + 2 ** 23, 1 + 2 ** 6, 0, 2]);
  function position(slot: number) {
    context.thread.x = slot;
    return integrate.call(
      context,
      state,
      [0.1, 4, 1, 3],
      [0, 0, 0, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [30, 60, 0, 0],
      [1, 0, 1, 1],
      [0, 0, 0, 0],
      mask,
      new Float32Array(65),
      new Float32Array(65),
      new Float32Array(1),
      [30, 60, 1 / 3, 1 / 3],
    );
  }
  expect(position(0)[0]).toBeCloseTo(10);
  expect(position(0)[1]).toBeCloseTo(20);
  expect(position(23)[0]).toBeCloseTo(20);
  expect(position(24)[0]).toBeCloseTo(30);
  expect(position(30)[0]).toBeCloseTo(30);
});
