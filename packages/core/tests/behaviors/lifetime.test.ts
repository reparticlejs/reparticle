import { expect, it } from 'vitest';

import { advanceAge, particleAlive } from '#src/behaviors/lifetime.js';

it('expires at the lifetime boundary and never activates an uninitialized slot', () => {
  expect(particleAlive(0, 0)).toBe(0);
  expect(particleAlive(0, 2)).toBe(1);
  expect(particleAlive(0, 0.001)).toBe(1);
  expect(particleAlive(1.9, 2)).toBe(1);
  expect(particleAlive(advanceAge(1.5, 0.5), 2)).toBe(0);
  expect(particleAlive(3, 2)).toBe(0);
});
