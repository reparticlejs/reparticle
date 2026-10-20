import { expect, it } from 'vitest';

import { spawnCircle } from '#src/simulation/emission/circle.js';

it('spawns throughout the disk with outward velocity and exact scalar speed', () => {
  const quadrants = [0, 0, 0, 0];
  let normalizedRadiusSquared = 0;
  for (let id = 0; id < 10000; id++) {
    const [x, y, velocityX, velocityY] = spawnCircle(id, 17, 25, -10, 220, 100);
    const dx = x - 25;
    const dy = y + 10;
    const radiusSquared = dx * dx + dy * dy;
    expect(radiusSquared).toBeLessThanOrEqual(2500);
    expect(Math.hypot(velocityX, velocityY)).toBeCloseTo(220, 8);
    expect(dx * velocityY - dy * velocityX).toBeCloseTo(0, 7);
    expect(dx * velocityX + dy * velocityY).toBeGreaterThanOrEqual(0);
    const quadrant = (dx < 0 ? 1 : 0) + (dy < 0 ? 2 : 0);
    quadrants[quadrant]! += 1;
    normalizedRadiusSquared += radiusSquared / 2500;
  }
  expect(normalizedRadiusSquared / 10000).toBeCloseTo(0.5, 1);
  expect(quadrants.every((count) => count > 2200 && count < 2800)).toBe(true);
});

it('supports a zero diameter without losing radial direction or scalar speed', () => {
  const first = spawnCircle(3, 17, 25, -10, 220, 0);
  expect(first.slice(0, 2)).toEqual([25, -10]);
  expect(Math.hypot(first[2], first[3])).toBeCloseTo(220);
  expect(spawnCircle(3, 17, 25, -10, 220, 0)).toEqual(first);
  expect(spawnCircle(3, 18, 25, -10, 220, 0)).not.toEqual(first);
});
