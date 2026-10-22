import { expect, it } from 'vitest';

import { integrate } from '#src/simulation/kernels/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it.each([0, 1, 2, 3])(
  'reflects shape %s at birth and retains its handedness after the emitter flips',
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
    const run = (handedness: number, spawn: number) =>
      integrate.call(
        context,
        state,
        /* step */ [0, spawn, 1, 0],
        /* emission */ [10, 0, 0, 10],
        /* shape */ [shape, 40, 80, 0],
        /* shapeSpread */ [0, 0, 0, 0],
        /* appearance */ [24, 0, 0, 0],
        /* color */ [1, 1, 1, 1],
        /* motionSpread */ [5, 0, 10, 0],
        /* colorSpread */ [0, 0, 0, 0],
        /* geometrySpread */ [0, 0, 0, 0],
        /* position */ [50, 60, 100, -50],
        /* transform */ [1, 0, 1, handedness],
        /* orientation */ [0, 0, 0, 0],
        new Float32Array(Math.ceil(context.constants.capacity / 24)).fill(16777215),
        new Float32Array(65),
        new Float32Array(65).fill(1),
        new Float32Array([0, 0]),
      );
    const base = run(1, 1);
    const reflected = run(-1, 1);
    expect(reflected[0]).toBeCloseTo(50 - (base[0] - 50));
    expect(reflected[1]).toBeCloseTo(base[1]);
    expect(reflected[2]).toBeCloseTo(100 - (base[2] - 100));
    expect(reflected[3]).toBeCloseTo(base[3]);
    state[0]![0] = reflected;
    expect(run(1, 0)).toEqual(reflected);
    context.thread.y = 4;
    const geometry = run(-1, 1);
    expect(geometry[2]).toBe(-1);
    state[4]![0] = geometry;
    expect(run(1, 0)[2]).toBe(-1);
    expect(run(1, 1)[2]).toBe(1);
  },
);
