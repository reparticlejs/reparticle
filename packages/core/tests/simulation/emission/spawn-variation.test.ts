import { expect, it } from 'vitest';

import { spawnVariation } from '#simulation/emission/direction.js';

it.each([0, 1, 65535])('spreads high slot IDs across both coordinates with seed %i', (seed) => {
  const bins = new Uint32Array(16 * 16);
  const samples = 200_000;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;

  for (let id = 800_000; id < 800_000 + samples; id++) {
    const x = spawnVariation(id, seed);
    const y = spawnVariation(id, seed + 173);
    if (x < 0 || x >= 1 || y < 0 || y >= 1) {
      throw new Error(`Out-of-range sample for slot ${id}`);
    }
    bins[Math.floor(x * 16) + Math.floor(y * 16) * 16]! += 1;
    sumX += x;
    sumY += y;
    sumXY += x * y;
  }

  const expected = samples / bins.length;
  expect(Math.min(...bins)).toBeGreaterThan(expected * 0.8);
  expect(Math.max(...bins)).toBeLessThan(expected * 1.2);
  expect(sumX / samples).toBeCloseTo(0.5, 2);
  expect(sumY / samples).toBeCloseTo(0.5, 2);
  expect(Math.abs(sumXY / samples - (sumX * sumY) / samples ** 2)).toBeLessThan(0.002);
});

it('does not repeat the slot sequence after 65,521 slots', () => {
  for (const id of [0, 1, 4092, 4093, 800_000, 934_478]) {
    expect(spawnVariation(id, 17)).not.toBe(spawnVariation(id + 65521, 17));
    expect(spawnVariation(id, 17)).toBe(spawnVariation(id, 17));
    expect(spawnVariation(id, 17)).not.toBe(spawnVariation(id, 18));
  }
});
