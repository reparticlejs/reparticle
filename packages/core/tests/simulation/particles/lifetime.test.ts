import { expect, it } from 'vitest';

import { advanceAge, particleAlive } from '#src/simulation/particles/lifetime.js';

it('expires strictly after the lifetime boundary', () => {
  expect(particleAlive(0, 0)).toBe(1);
  expect(particleAlive(0, 2)).toBe(1);
  expect(particleAlive(0, 0.001)).toBe(1);
  expect(particleAlive(1.9, 2)).toBe(1);
  expect(particleAlive(advanceAge(1.5, 0.5), 2)).toBe(1);
  expect(particleAlive(3, 2)).toBe(0);
});
