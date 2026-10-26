import { expect, it } from 'vitest';

import { applyAcceleration } from '#simulation/modifiers/acceleration.js';

it('projects signed magnitude and the persistent particle spread onto each axis', () => {
  expect(applyAcceleration(-1, 100, 40, 0.5)).toBe(-120);
  expect(applyAcceleration(0, 100, 40, 0.5)).toBe(0);
  expect(applyAcceleration(1, -100, 40, -0.5)).toBe(-120);
});
