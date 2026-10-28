import { expect, it } from 'vitest';

import { integrate } from '#test-support/simulation';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('applies radial after drag with stable spread and integrates its displacement once', () => {
  const state: ParticleTexture = [
    [[3, 4, 100, 50]],
    [[0, 10, 24, 0]],
    [[1, 1, 1, 1]],
    [[1, 0.5, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const run = (seed: number) =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, 0, seed, 0],
      /* emission */ [0, 0, 0, 10],
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
      new Float32Array([
        3, 1, 0, 100, 40, 0, 0, 0.6, -0.8, 0, 0, 1, 2, 2, 0, 0, 1, 0, 0, 0, 2, 100, 40, 0, 0, 0, 0,
        5, 0,
      ]),
    );
  expect(run(1)[2]).toBeCloseTo((100 + 120 * 0.6 * 0.1) * 0.7 + 7.2);
  expect(run(1)[3]).toBeCloseTo((50 - 120 * 0.8 * 0.1) * 0.7 + 9.6);
  expect(run(1)[0]).toBeCloseTo(3 + 100 * 0.1 + 72 * 0.01 - 107.2 * 0.3 * 0.1 + 0.72);
  expect(run(1)[1]).toBeCloseTo(4 + 50 * 0.1 - 96 * 0.01 - 40.4 * 0.3 * 0.1 + 0.96);
  expect(run(99)).toEqual(run(1));
});
