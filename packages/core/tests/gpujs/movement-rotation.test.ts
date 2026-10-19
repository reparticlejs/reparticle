import { expect, it } from 'vitest';

import { movementRotation } from '#src/gpujs/movement-rotation.js';

it.each([
  [0, -10, 0],
  [10, 0, -90],
  [-10, 0, 90],
  [0, 10, 180],
  [0.001, 10, 180],
  [0, 0, 0],
  [0.01, 0, 0],
  [0.01001, 0, -90],
])('resolves velocity (%s, %s) to %s degrees', (x, y, expected) => {
  expect(movementRotation(x, y)).toBeCloseTo(expected);
});
