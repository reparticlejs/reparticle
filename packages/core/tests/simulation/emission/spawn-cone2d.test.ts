import { expect, it } from 'vitest';

import { spawnCone2D } from '#simulation/emission/cone2d.js';
import { spawnVariation } from '#simulation/emission/direction.js';

it('fills the triangle uniformly and directs velocity away from the tip', () => {
  let sumX = 0;
  let sumHeight = 0;
  let lowerHalf = 0;
  let minHeight = Infinity;
  let maxHeight = -Infinity;
  let maxEdgeExcess = -Infinity;
  let maxSpeedError = 0;
  let maxDirectionError = 0;
  let minOutwardVelocity = Infinity;
  // Check every sample, but aggregate errors to avoid thousands of matcher calls.
  for (let id = 0; id < 10000; id++) {
    const [x, y, velocityX, velocityY] = spawnCone2D(id, 17, 10, 20, 220, 200, 100);
    const offsetX = x - 10;
    const height = 20 - y;
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
    maxEdgeExcess = Math.max(maxEdgeExcess, Math.abs(offsetX) - (height + 1e-10));
    maxSpeedError = Math.max(maxSpeedError, Math.abs(Math.hypot(velocityX, velocityY) - 220));
    maxDirectionError = Math.max(
      maxDirectionError,
      Math.abs(offsetX * velocityY + height * velocityX),
    );
    minOutwardVelocity = Math.min(minOutwardVelocity, offsetX * velocityX - height * velocityY);
    sumX += offsetX;
    sumHeight += height;
    if (height < 50) {
      lowerHalf++;
    }
  }
  expect(minHeight).toBeGreaterThanOrEqual(0);
  expect(maxHeight).toBeLessThanOrEqual(100);
  expect(maxEdgeExcess).toBeLessThanOrEqual(0);
  expect(maxSpeedError).toBeCloseTo(0);
  expect(maxDirectionError).toBeCloseTo(0);
  expect(minOutwardVelocity).toBeGreaterThanOrEqual(0);
  expect(Math.abs(sumX / 10000)).toBeLessThan(1);
  expect(Math.abs(sumHeight / 10000 - 200 / 3)).toBeLessThan(1);
  // The half nearest the tip occupies one quarter of the triangle's area.
  expect(lowerHalf / 10000).toBeGreaterThan(0.23);
  expect(lowerHalf / 10000).toBeLessThan(0.27);
});

it('folds samples beyond the far edge back into the triangle', () => {
  for (let id = 0; id < 100; id++) {
    const u = spawnVariation(id, 17);
    const v = spawnVariation(id, 190);
    const height = 100 * Math.min(u + v, 2 - u - v);
    const [x, y] = spawnCone2D(id, 17, 0, 0, 10, 200, 100);
    expect(x).toBeCloseTo((v - u) * 100);
    expect(y).toBeCloseTo(-height);
  }
});

it('handles collapsed dimensions without NaN or losing initial speed', () => {
  expect([...spawnCone2D(1, 17, 10, 20, 220, 0, 0)]).toEqual([10, 20, 0, -220]);
  for (let id = 0; id < 100; id++) {
    const vertical = spawnCone2D(id, 17, 10, 20, 220, 0, 100);
    expect(vertical[0]).toBe(10);
    expect(vertical[2]).toBeCloseTo(0);
    expect(vertical[3]).toBe(-220);
    const flat = spawnCone2D(id, 17, 10, 20, 220, 200, 0);
    expect(flat[1]).toBe(20);
    expect(Math.hypot(flat[2], flat[3])).toBe(220);
    expect(Math.abs(flat[2])).toBe(flat[0] === 10 ? 0 : 220);
  }
});
