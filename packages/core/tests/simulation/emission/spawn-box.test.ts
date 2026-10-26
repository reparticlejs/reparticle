import { expect, it } from 'vitest';

import { spawnBox } from '#src/simulation/emission/box.js';

it('fills a centered rectangle uniformly with parallel upward velocity', () => {
  const quadrants = [0, 0, 0, 0];
  let sumX = 0;
  let sumY = 0;
  for (let id = 0; id < 10000; id++) {
    const [x, y, velocityX, velocityY] = spawnBox(id, 17, 10, 20, 220, 200, 100);
    expect(x).toBeGreaterThanOrEqual(-90);
    expect(x).toBeLessThanOrEqual(110);
    expect(y).toBeGreaterThanOrEqual(-30);
    expect(y).toBeLessThanOrEqual(70);
    expect([velocityX, velocityY]).toEqual([0, -220]);
    const quadrant = Number(x >= 10) + 2 * Number(y >= 20);
    quadrants[quadrant]!++;
    sumX += x;
    sumY += y;
  }
  expect(Math.abs(sumX / 10000 - 10)).toBeLessThan(2);
  expect(Math.abs(sumY / 10000 - 20)).toBeLessThan(1);
  for (const count of quadrants) {
    expect(count).toBeGreaterThan(2300);
    expect(count).toBeLessThan(2700);
  }
});

it('supports degenerate dimensions without losing upward velocity', () => {
  expect([...spawnBox(1, 17, 10, 20, 220, 0, 0)]).toEqual([10, 20, 0, -220]);
  expect(spawnBox(1, 17, 10, 20, 220, 0, 100)[0]).toBe(10);
  expect(spawnBox(1, 17, 10, 20, 220, 200, 0)[1]).toBe(20);
});
