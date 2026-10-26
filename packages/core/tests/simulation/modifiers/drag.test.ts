import { expect, it } from 'vitest';

import { applyDrag } from '#simulation/modifiers/drag.js';

it('uses linear damping capped at one, with signed spread and negative drag', () => {
  expect(applyDrag(100, 100, 2, 0, 0, 0.1)).toBe(80);
  expect(applyDrag(100, 100, 100, 0, 0, 0.1)).toBe(0);
  expect(applyDrag(100, 100, -2, 0, 0, 0.1)).toBe(120);
  expect(applyDrag(100, 100, 2, 2, -0.5, 0.1)).toBe(90);
  expect(applyDrag(100, 0, 20, 0, 0, 0.1)).toBe(100);
  expect(applyDrag(100, 100, 20, 0, 0, 0)).toBe(100);
});
