import { expect, it } from 'vitest';

import { spawnVariation } from '#src/behaviors/spawn.js';
import { spawnCone2D } from '#src/gpujs/spawn-cone2d.js';

it('fills the triangle uniformly and directs velocity away from the tip', () => {
  let sumX = 0;
  let sumHeight = 0;
  let lowerHalf = 0;
  for (let id = 0; id < 10000; id++) {
    const [x, y, velocityX, velocityY] = spawnCone2D(id, 17, 10, 20, 220, 200, 100);
    const offsetX = x - 10;
    const height = 20 - y;
    expect(height).toBeGreaterThanOrEqual(0);
    expect(height).toBeLessThanOrEqual(100);
    expect(Math.abs(offsetX)).toBeLessThanOrEqual(height + 1e-10);
    expect(Math.hypot(velocityX, velocityY)).toBeCloseTo(220);
    expect(offsetX * velocityY + height * velocityX).toBeCloseTo(0);
    expect(offsetX * velocityX - height * velocityY).toBeGreaterThanOrEqual(0);
    sumX += offsetX;
    sumHeight += height;
    if (height < 50) {
      lowerHalf++;
    }
  }
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
  expect(spawnCone2D(1, 17, 10, 20, 220, 0, 0)).toEqual([10, 20, 0, -220]);
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
