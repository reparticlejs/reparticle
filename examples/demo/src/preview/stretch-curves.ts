import type { ScalarProperty } from '@reparticle/core';

export const stretchCurves = {
  constant: 0,
  grow: {
    points: [
      { time: 0, value: 0, tangent: 1 },
      { time: 1, value: 1, tangent: 1 },
    ],
  },
  shrink: {
    points: [
      { time: 0, value: 0, tangent: -1 },
      { time: 1, value: -1, tangent: -1 },
    ],
  },
  mirror: {
    points: [
      { time: 0, value: 0, tangent: -2 },
      { time: 1, value: -2, tangent: -2 },
    ],
  },
} satisfies Record<string, ScalarProperty>;
