import { expect, it } from 'vitest';

import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it.each([0, 1, 2, 3])(
  'rotates shape %s around its emitter and adds inheritance after rotation',
  (shape) => {
    const state: ParticleTexture = [[[0, 0, 0, 0]], [[0, 10, 24, 0]], [[1, 1, 1, 1]]];
    const context: KernelContext = {
      thread: { x: 0, y: 0 },
      constants: { width: 1, rows: 1, capacity: 1 },
    };
    const run = (cosine: number, sine: number, inheritX: number) =>
      integrate.call(
        context,
        state,
        0,
        0,
        1,
        50,
        60,
        10,
        0,
        0,
        0,
        10,
        1,
        shape,
        40,
        80,
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
        inheritX,
        0,
        cosine,
        sine,
        1,
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
        0,
        0,
        0,
        0,
      );
    const base = run(1, 0, 0);
    const rotated = run(0, -1, 100);
    expect(rotated[0]).toBeCloseTo(50 + base[1] - 60);
    expect(rotated[1]).toBeCloseTo(60 - (base[0] - 50));
    expect(rotated[2]).toBeCloseTo(base[3] + 100);
    expect(rotated[3]).toBeCloseTo(-base[2]);
  },
);
