import { expect, it } from 'vitest';

import { textureLayout } from '#src/runtime/gpu/texture-layout.js';

it('packs small and million-slot emitters without padding', () => {
  expect(textureLayout(1, 16384)).toEqual({ width: 1, rows: 1 });
  expect(textureLayout(16, 16384)).toEqual({ width: 8, rows: 2 });
  const layout = textureLayout(1_000_000, 16384);
  expect(layout.width * layout.rows).toBe(1_000_000);
  expect(layout.width).toBeLessThanOrEqual(16384);
  expect(layout.rows * 5).toBeLessThanOrEqual(16384);
});

it('finds minimum storage and the closest-to-square tie within device limits', () => {
  const limit = 20;
  for (let capacity = 1; capacity <= 80; capacity++) {
    const actual = textureLayout(capacity, limit);
    const candidates = [];
    for (let width = 1; width <= limit; width++) {
      for (let rows = 1; rows <= limit / 5; rows++) {
        if (width * rows >= capacity) {
          candidates.push({ width, rows });
        }
      }
    }
    candidates.sort(
      (a, b) =>
        a.width * a.rows - b.width * b.rows ||
        Math.abs(a.width - a.rows * 5) - Math.abs(b.width - b.rows * 5),
    );
    const best = candidates[0]!;
    expect(actual.width * actual.rows).toBe(best.width * best.rows);
    expect(Math.abs(actual.width - actual.rows * 5)).toBe(Math.abs(best.width - best.rows * 5));
  }
});

it('rejects capacity that cannot fit all five bands', () => {
  expect(() => textureLayout(81, 20)).toThrow('Capacity exceeds GPU texture limits');
  expect(() => textureLayout(1, 4)).toThrow('Capacity exceeds GPU texture limits');
});
