import type { ScalarProperty } from '@reparticle/core';

export const alphaCurves = {
  constant: 1,
  'fade-out': {
    points: [
      { time: 0, value: 1, tangent: -1 },
      { time: 1, value: 0, tangent: -1 },
    ],
  },
  'fade-in-out': {
    points: [
      { time: 0, value: 0, tangent: 0 },
      { time: 0.2, value: 1, tangent: 0 },
      { time: 1, value: 0, tangent: 0 },
    ],
  },
} satisfies Record<string, ScalarProperty>;
