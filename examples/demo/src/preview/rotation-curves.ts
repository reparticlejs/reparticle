import type { ScalarProperty } from '@reparticle/core';

export const rotationCurves = {
  constant: 0,
  'full-turn': {
    points: [
      { time: 0, value: 0, tangent: 360 },
      { time: 1, value: 360, tangent: 360 },
    ],
  },
  'reverse-turn': {
    points: [
      { time: 0, value: 0, tangent: -360 },
      { time: 1, value: -360, tangent: -360 },
    ],
  },
} satisfies Record<string, ScalarProperty>;
