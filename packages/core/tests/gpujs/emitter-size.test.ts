import { expect, it } from 'vitest';

import { propertyVariation } from '#src/behaviors/property-variation.js';
import { integrate } from '#src/gpujs/integrate.js';
import { spawnBox } from '#src/gpujs/spawn-box.js';
import { spawnCircle } from '#src/gpujs/spawn-circle.js';
import { spawnCone2D } from '#src/gpujs/spawn-cone2d.js';
import { spawnRotation } from '#src/gpujs/spawn-rotation.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

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
          0,
          new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
          spawn,
          0,
          0,
          1,
          0,
          0,
          10,
          seed,
          shape,
          -20,
          10,
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
          100,
          80,
          0,
          0,
          1,
          0,
          1,
          new Float32Array(65),
          0,
          0,
          0,
          new Float32Array(65).fill(1),
          0,
          0,
          0,
          0,
          0,
          new Float32Array([0, 0]),
        );
      context.thread.y = 0;
      expect(run(1)).toEqual(expected);
      state[0]![0] = expected;
      expect(run(0)).toEqual(expected);
      context.thread.y = 1;
      expect(run(1)[3]).toBeCloseTo(spawnRotation(expected[2], expected[3]));
    }
  },
);
