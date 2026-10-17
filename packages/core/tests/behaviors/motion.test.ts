import { expect, it } from 'vitest';

import { advancePosition, advanceVelocity } from '#src/behaviors/motion.js';

it('integrates gravity equivalently over one step and ten smaller steps', () => {
  let position = 10,
    velocity = -30;
  for (let step = 0; step < 10; step++) {
    position = advancePosition(position, velocity, 100, 0.05);
    velocity = advanceVelocity(velocity, 100, 0.05);
  }
  expect(position).toBeCloseTo(advancePosition(10, -30, 100, 0.5), 10);
  expect(velocity).toBeCloseTo(20, 10);
  expect(advancePosition(10, -30, 0, 0.5)).toBe(-5);
});
