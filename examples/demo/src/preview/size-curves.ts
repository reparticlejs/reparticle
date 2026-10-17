import type { ScalarProperty } from '@reparticle/core';

export const sizeCurves = {
  constant: 1,
  shrink: {
    points: [
      { time: 0, value: 1, tangent: -1 },
      { time: 1, value: 0, tangent: -1 },
    ],
  },
  'grow-shrink': {
    points: [
      { time: 0, value: 0, tangent: 0 },
      { time: 0.2, value: 1, tangent: 0 },
      { time: 1, value: 0, tangent: 0 },
    ],
  },
} satisfies Record<string, ScalarProperty>;
