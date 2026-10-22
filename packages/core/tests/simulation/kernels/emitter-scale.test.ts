import { expect, it } from 'vitest';

import { integrate } from '#src/simulation/kernels/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it.each([0, 0.5, 2, -2])(
  'scales birth offsets, speed and size by %s without scaling inherited velocity',
  (scale) => {
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
    const run = (factor: number, spawn: number) =>
      integrate.call(
        context,
        state,
        /* step */ [0, spawn, 1, 0],
        /* emission */ [10, 0, 0, 10],
        /* shape */ [2, 40, 80, 0],
        /* shapeSpread */ [0, 0, 0, 0],
        /* appearance */ [24, 0, 0, 0],
        /* color */ [1, 1, 1, 1],
        /* motionSpread */ [5, 0, 10, 0],
        /* colorSpread */ [0, 0, 0, 0],
        /* geometrySpread */ [0, 0, 0, 0],
        /* position */ [50, 60, 100, -50],
        /* transform */ [0, -1, factor, 1],
        /* orientation */ [0, 0, 0, 0],
        new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
        new Float32Array(65),
        new Float32Array(65).fill(1),
        new Float32Array([0, 0]),
        /* path */ [0, 0, 0, 0],
      );
    const base = run(1, 1);
    const scaled = run(scale, 1);
    expect(scaled[0]).toBeCloseTo(50 + (base[0] - 50) * scale);
    expect(scaled[1]).toBeCloseTo(60 + (base[1] - 60) * scale);
    expect(scaled[2]).toBeCloseTo((base[2] - 100) * scale + 100);
    expect(scaled[3]).toBeCloseTo((base[3] + 50) * scale - 50);
    state[0]![0] = scaled;
    expect(run(7, 0)).toEqual(scaled);
    context.thread.y = 1;
    expect(run(scale, 1)[2]).toBeCloseTo(run(1, 1)[2] * scale);
  },
);
