import { expect, it } from 'vitest';

import { spawnBox } from '#src/simulation/emission/box.js';
import { spawnCircle } from '#src/simulation/emission/circle.js';
import { spawnCone2D } from '#src/simulation/emission/cone2d.js';
import { spawnRotation } from '#src/simulation/emission/rotation.js';
import { propertyVariation } from '#src/simulation/emission/variation.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

import { integrate } from '../../support/simulation';

it.each([1, 2, 3])(
  'uses independent signed dimensions for shape %s position and initial orientation',
  (shape) => {
    const state: ParticleTexture = [
      [[0, 0, 0, 0]],
      [[0, 10, 24, 0]],
      [[1, 1, 1, 1]],
      [[0, 0, 0, 0]],
      [[0, 0, 0, 0]],
    ];
    const context: KernelContext = {
      thread: { x: 0, y: 0 },
      constants: { rows: 1, width: 1, capacity: 1 },
    };
    for (let seed = 0; seed < 30; seed++) {
      const x = -20 + propertyVariation(0, seed, 12) * 100;
      const y = 10 + propertyVariation(0, seed, 13) * 80;
      const expected =
        shape === 1
          ? spawnCircle(0, seed, 0, 0, 1, x)
          : shape === 2
            ? spawnBox(0, seed, 0, 0, 1, x, y)
            : spawnCone2D(0, seed, 0, 0, 1, x, y);
      const run = (spawn: number) =>
        integrate.call(
          context,
          state,
          /* step */ [0, spawn, seed, 0],
          /* emission */ [1, 0, 0, 10],
          /* shape */ [shape, -20, 10, 0],
          /* shapeSpread */ [100, 80, 0, 0],
          /* appearance */ [24, 0, 0, 0],
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
          new Float32Array([0, 0]),
        );
      context.thread.y = 0;
      expect(run(1)).toEqual([...expected]);
      state[0]![0] = expected;
      expect(run(0)).toEqual([...expected]);
      context.thread.y = 1;
      expect(run(1)[3]).toBeCloseTo(spawnRotation(expected[2], expected[3]));
    }
  },
);
