import { expect, it } from 'vitest';

import { applyVortex } from '#src/simulation/modifiers/vortex.js';

it('turns tangentially with signed magnitude and no distance falloff', () => {
  expect([...applyVortex(3, 4, 0, 0, -1, 0, 100, 0, 0, 5)]).toEqual([80, -60]);
  expect([...applyVortex(3, 4, 0, 0, -1, 0, -100, 0, 0, 5)]).toEqual([-80, 60]);
  expect([...applyVortex(1.5, 2, 0, 0, -1, 0, 100, 0, 0, 5)]).toEqual([80, -60]);
  expect([...applyVortex(3, 4, 0, 0, -1, 0, 100, 0, 0, 4.99)]).toEqual([0, 0]);
});

it('uses the modifier fallback at the center and includes the zero cutoff', () => {
  expect([...applyVortex(10, 20, 10, 20, 0, 1, 100, 40, 0.5, 0)]).toEqual([0, 120]);
  expect([...applyVortex(10.01, 20, 10, 20, -1, 0, 100, 0, 0, 0)]).toEqual([0, 0]);
});
