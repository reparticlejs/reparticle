import { expect, it } from 'vitest';

import { propertyVariation } from '#src/behaviors/property-variation.js';
import { integrate } from '#src/gpujs/integrate.js';
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
      0.1,
      new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
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
      0,
      40,
      new Float32Array(65).fill(1),
      0,
      stretchX,
      -1,
      0.5,
      0.25,
      new Float32Array([2, 0, 0, 100, 40, 0, 0, 0.6, -0.8, 0, 0, 1, 2, 2, 0, 0, 1, 0, 0, 0]),
      1,
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
