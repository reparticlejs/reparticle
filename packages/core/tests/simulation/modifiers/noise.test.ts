import { d } from 'typegpu';
import { expect, it } from 'vitest';

import { applyNoise, curlNoise } from '#simulation/modifiers/noise.js';

it('is deterministic, seeded, bounded, and spatially varying', () => {
  const values = [];
  for (let i = -20; i < 20; i++) {
    const x = i * 0.137;
    const result = [...curlNoise(x, x * 1.7, 42)];
    expect(result).toEqual([...curlNoise(x, x * 1.7, 42)]);
    expect(result.every((value) => Number.isFinite(value) && Math.abs(value) <= 1)).toBe(true);
    values.push(result);
  }
  expect(new Set(values.map(String)).size).toBeGreaterThan(30);
  expect([...curlNoise(0.31, -0.72, 42)]).not.toEqual([...curlNoise(0.31, -0.72, 43)]);
});

it('stays smooth across lattice boundaries and has negligible divergence', () => {
  const epsilon = 0.0001;
  for (const x of [-2, -0.37, 0, 0.63, 1]) {
    const left = curlNoise(x - epsilon, 0.43, 17);
    const right = curlNoise(x + epsilon, 0.43, 17);
    const up = curlNoise(x, 0.43 - epsilon, 17);
    const down = curlNoise(x, 0.43 + epsilon, 17);
    expect(Math.abs(left.x - right.x)).toBeLessThan(0.002);
    expect(Math.abs(left.y - right.y)).toBeLessThan(0.002);
    const divergence = (right.x - left.x + down.y - up.y) / (2 * epsilon);
    expect(Math.abs(divergence)).toBeLessThan(0.002);
  }
});

it('animates smoothly and inverse-transforms the field with its force', () => {
  const sample = (
    position: ReturnType<typeof d.vec2f>,
    origin: ReturnType<typeof d.vec2f>,
    axis: ReturnType<typeof d.vec2f>,
    frequency: number,
    phase: number,
  ) => applyNoise(position, origin, axis, frequency, phase, 5, 1);
  const base = sample(d.vec2f(31, 47), d.vec2f(0, 0), d.vec2f(1, 0), 0.01, 0);
  const rotated = sample(d.vec2f(10 - 94, 20 + 62), d.vec2f(10, 20), d.vec2f(0, 1), 0.005, 0);
  expect(rotated.x).toBeCloseTo(-base.y);
  expect(rotated.y).toBeCloseTo(base.x);
  const later = sample(d.vec2f(31, 47), d.vec2f(0, 0), d.vec2f(1, 0), 0.01, 0.3);
  expect([...later]).not.toEqual([...base]);
});
