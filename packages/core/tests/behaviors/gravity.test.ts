import { expect, it } from 'vitest';

import { applyGravity } from '#src/behaviors/gravity.js';
import { advancePosition, advanceVelocity } from '#src/behaviors/motion.js';

it('adds gravity to existing acceleration before motion integrates it once', () => {
  const acceleration = applyGravity(20, -100);
  expect(acceleration).toBe(-80);
  expect(advancePosition(10, 30, acceleration, 0.5)).toBe(15);
  expect(advanceVelocity(30, acceleration, 0.5)).toBe(-10);
});
