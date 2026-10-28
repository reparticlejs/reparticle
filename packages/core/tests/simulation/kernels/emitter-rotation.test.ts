import { expect, it } from 'vitest';

import { integrate } from '#test-support/simulation';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it.each([0, 1, 2, 3])(
  'rotates shape %s around its emitter and adds inheritance after rotation',
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
      constants: { width: 1, rows: 1, capacity: 1 },
    };
    const run = (cosine: number, sine: number, inheritX: number) =>
      integrate.call(
        context,
        state,
        /* step */ [0, 1, 1, 0],
        /* emission */ [10, 0, 0, 10],
        /* shape */ [shape, 40, 80, 0],
        /* shapeSpread */ [0, 0, 0, 0],
        /* appearance */ [24, 0, 0, 0],
        /* color */ [1, 1, 1, 1],
        /* motionSpread */ [0, 0, 0, 0],
        /* colorSpread */ [0, 0, 0, 0],
        /* geometrySpread */ [0, 0, 0, 0],
        /* position */ [50, 60, inheritX, 0],
        /* transform */ [cosine, sine, 1, 1],
        /* orientation */ [0, 0, 0, 0],
        new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
        new Float32Array(65),
        new Float32Array(65).fill(1),
        new Float32Array([0, 0]),
      );
    const base = run(1, 0, 0);
    const rotated = run(0, -1, 100);
    expect(rotated[0]).toBeCloseTo(50 + base[1] - 60);
    expect(rotated[1]).toBeCloseTo(60 - (base[0] - 50));
    expect(rotated[2]).toBeCloseTo(base[3] + 100);
    expect(rotated[3]).toBeCloseTo(-base[2]);
  },
);
