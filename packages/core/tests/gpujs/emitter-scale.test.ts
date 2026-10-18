import { expect, it } from 'vitest';

import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it.each([0, 0.5, 2, -2])(
  'scales birth offsets, speed and size by %s without scaling inherited velocity',
  (scale) => {
    const state: ParticleTexture = [[[0, 0, 0, 0]], [[0, 10, 24, 0]], [[1, 1, 1, 1]]];
    const context: KernelContext = {
      thread: { x: 0, y: 0 },
      constants: { width: 1, rows: 1, capacity: 1 },
    };
    const run = (factor: number, spawn: number) =>
      integrate.call(
        context,
        state,
        0,
        0,
        spawn,
        50,
        60,
        10,
        0,
        0,
        0,
        10,
        1,
        2,
        40,
        80,
        24,
        1,
        1,
        1,
        1,
        0,
        0,
        5,
        0,
        10,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        100,
        -50,
        0,
        -1,
        factor,
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
        0,
        0,
        new Float32Array(65).fill(1),
        0,
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
