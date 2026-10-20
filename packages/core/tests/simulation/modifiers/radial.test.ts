import { expect, it } from 'vitest';

import { applyRadial } from '#src/simulation/modifiers/radial.js';

it('repels or attracts at constant strength inside the inclusive cutoff', () => {
  expect(applyRadial(3, 4, 0, 0, 0, -1, 100, 0, 0, 5)).toEqual([60, 80]);
  expect(applyRadial(3, 4, 0, 0, 0, -1, -100, 0, 0, 5)).toEqual([-60, -80]);
  expect(applyRadial(1.5, 2, 0, 0, 0, -1, 100, 0, 0, 5)).toEqual([60, 80]);
  expect(applyRadial(3, 4, 0, 0, 0, -1, 100, 0, 0, 4.99)).toEqual([0, 0]);
});

it('uses the particle heading at the exact center, including a zero distance cutoff', () => {
  expect(applyRadial(10, 20, 10, 20, -1, 0, 100, 40, 0.5, 0)).toEqual([-120, 0]);
  expect(applyRadial(10.01, 20, 10, 20, -1, 0, 100, 0, 0, 0)).toEqual([0, 0]);
});
