import type { ScalarProperty } from '@reparticle/core';

export const angularVelocityCurves = {
  constant: 1,
  'speed-up': {
    points: [
      { time: 0, value: 0, tangent: 1 },
      { time: 1, value: 1, tangent: 1 },
    ],
  },
  'slow-down': {
    points: [
      { time: 0, value: 1, tangent: -1 },
      { time: 1, value: 0, tangent: -1 },
    ],
  },
  reverse: {
    points: [
      { time: 0, value: 1, tangent: -2 },
      { time: 1, value: -1, tangent: -2 },
    ],
  },
} satisfies Record<string, ScalarProperty>;
