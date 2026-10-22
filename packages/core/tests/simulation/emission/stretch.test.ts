import { expect, it } from 'vitest';

import { propertyVariation } from '#src/simulation/emission/variation.js';
import { integrate } from '#src/simulation/kernels/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('captures independent stretch spread, retains it, and replaces it on slot reuse', () => {
  const state: ParticleTexture = [
    [[0, 0, 0, 0]],
    [[0, 2, 24, 0]],
    [[1, 1, 1, 1]],
    [[0, 0, 0, 0]],
    [[0, 0, 0, 0]],
  ];
  const context: KernelContext = {
    thread: { x: 0, y: 4 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  let spawning = 1;
  let stretchX = 1;
  const run = (seed: number) =>
    integrate.call(
      context,
      state,
      /* step */ [0.1, spawning, seed, 0],
      /* emission */ [0, 0, 0, 10],
      /* shape */ [0, 0, 0, 0],
      /* shapeSpread */ [0, 0, 0, 0],
      /* appearance */ [24, 0, stretchX, -1],
      /* color */ [1, 1, 1, 1],
      /* motionSpread */ [0, 0, 0, 0],
      /* colorSpread */ [0, 0, 0, 0],
      /* geometrySpread */ [40, 0.5, 0.25, 0],
      /* position */ [0, 0, 0, 0],
      /* transform */ [1, 0, 1, 1],
      /* orientation */ [0, 0, 0, 0],
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
      new Float32Array(65),
      new Float32Array(65).fill(1),
      new Float32Array([2, 0, 0, 100, 40, 0, 0, 0.6, -0.8, 0, 0, 1, 2, 2, 0, 0, 1, 0, 0, 0]),
    );
  const born = run(1);
  expect(born[0]).toBeCloseTo(1 + propertyVariation(0, 1, 16) * 0.5);
  expect(born[1]).toBeCloseTo(-1 + propertyVariation(0, 1, 17) * 0.25);
  expect(born.slice(2)).toEqual([1, 0]);
  state[4]![0] = born;
  spawning = 0;
  stretchX = 3;
  expect(run(99)).toEqual(born);
  spawning = 1;
  expect(run(99)[0]).toBeCloseTo(3 + propertyVariation(0, 99, 16) * 0.5);
  expect(run(99)[1]).toBeCloseTo(-1 + propertyVariation(0, 99, 17) * 0.25);
});
