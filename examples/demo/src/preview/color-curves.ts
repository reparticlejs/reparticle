import type { ColorCurves } from '../types/preview';

export const colorCurves = {
  constant: { red: 1, green: 1, blue: 1 },
  fire: {
    red: 1,
    green: {
      points: [
        { time: 0, value: 1, tangent: -1 },
        { time: 1, value: 0, tangent: -1 },
      ],
    },
    blue: {
      points: [
        { time: 0, value: 0.5, tangent: -0.5 },
        { time: 1, value: 0, tangent: -0.5 },
      ],
    },
  },
  'blue-to-pink': {
    red: {
      points: [
        { time: 0, value: 0.1, tangent: 0.9 },
        { time: 1, value: 1, tangent: 0.9 },
      ],
    },
    green: 0.3,
    blue: 1,
  },
} satisfies Record<string, ColorCurves>;
