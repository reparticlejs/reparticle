import { expect, it } from 'vitest';

import { EffectTransform } from '#src/effect-transform.js';
import { SharedModifiers } from '#src/shared-modifiers.js';

it('composes scale, counterclockwise rotation and translation', () => {
  const transform = new EffectTransform();
  transform.set({ x: 100, y: 50, rotation: 90, scale: 2 });
  expect(transform.applyX(10, 5)).toBeCloseTo(110);
  expect(transform.applyY(10, 5)).toBeCloseTo(30);
  transform.x = 200;
  expect(transform.applyX(10, 5)).toBeCloseTo(210);
});

it('rejects invalid patches atomically and supports zero and negative scale', () => {
  const transform = new EffectTransform();
  expect(() => transform.set({ x: 4, rotation: NaN })).toThrow(RangeError);
  expect(transform.x).toBe(0);
  transform.scale = 0;
  expect(transform.applyX(9, 10)).toBe(0);
  transform.scale = -2;
  expect(transform.applyY(9, 10)).toBe(-20);
});

it('moves shared modifier centers and rotates/scales world forces', () => {
  const transform = new EffectTransform();
  transform.set({ x: 100, y: 50, rotation: 90, scale: 2 });
  const shared = new SharedModifiers({
    acceleration: { magnitude: 10 },
    radial: { x: 10, y: 5, magnitude: 3, maxDistance: 20 },
  });
  const values = shared.sample(0, false, 0, 0, 0, 1, transform);
  expect(values[1]).toBe(20);
  expect(values[3]).toBeCloseTo(-1);
  expect(values[4]).toBeCloseTo(0);
  expect(values[12]).toBeCloseTo(110);
  expect(values[13]).toBeCloseTo(30);
  expect(values[14]).toBe(40);
  const local = shared.sample(0, true, 0, 0, 0, 1, transform);
  expect(local[1]).toBe(10);
  expect(local[12]).toBe(10);
  expect(local[13]).toBe(5);
});
