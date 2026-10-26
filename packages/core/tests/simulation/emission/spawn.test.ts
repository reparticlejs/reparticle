import { expect, it } from 'vitest';

import { spawnDirection, spawnVariation } from '#src/simulation/emission/direction.js';
import { spawnMotion } from '#src/simulation/emission/motion.js';

it('keeps spawn direction within its range and scalar speed exact', () => {
  for (let id = 0; id < 100; id++) {
    const variation = spawnVariation(id, 1);
    expect(variation).toBeGreaterThanOrEqual(0);
    expect(variation).toBeLessThan(1);
    expect(spawnVariation(id, 1)).toBe(variation);
    expect(spawnDirection(0, 2, variation)).toBeGreaterThanOrEqual(-1);
    expect(spawnDirection(0, 2, variation)).toBeLessThan(1);
    const [, , velocityX, velocityY] = spawnMotion(id, 1, 0, 0, 100, 0, 2);
    expect(Math.hypot(velocityX, velocityY)).toBeCloseTo(100, 4);
  }
});
