import { expect, it } from 'vitest';

import { sampleCurve } from '#curves/sample-curve.js';
import { particleHeading } from '#test-support/simulation';

it('combines initial rotation with the lifetime rotation curve', () => {
  const curve = sampleCurve({
    points: [
      { time: 0, value: 0, tangent: 90 },
      { time: 1, value: 90, tangent: 90 },
    ],
  });
  const heading = particleHeading(45, 1, 2, curve, 0, 0, 0, 1);
  expect(heading[0]).toBeCloseTo(-1);
  expect(heading[1]).toBeCloseTo(0);
});

it('follows movement with low-speed and opposite-direction fallbacks', () => {
  const curve = sampleCurve(0);
  const moving = particleHeading(0, 0, 2, curve, 10, 0, 1, 1);
  expect(moving[0]).toBeCloseTo(1);
  expect(moving[1]).toBeCloseTo(0);
  const stopped = particleHeading(90, 0, 2, curve, 0.001, 0, 1, 1);
  expect(stopped[0]).toBeCloseTo(-1);
  expect(stopped[1]).toBeCloseTo(0);
  const reversed = particleHeading(90, 0, 2, curve, 0, 10, 1, 1);
  expect(reversed[0]).toBeCloseTo(1);
  expect(reversed[1]).toBeCloseTo(0);
});

it('mirrors lifetime rotation and movement-relative orientation', () => {
  const curve = new Float32Array(65).fill(25);
  for (const movement of [0, 1]) {
    const normal = particleHeading(30, 1, 2, curve, 3, -4, movement, 1);
    const reflected = particleHeading(-30, 1, 2, curve, -3, -4, movement, -1);
    expect(reflected[0]).toBeCloseTo(-normal[0]);
    expect(reflected[1]).toBeCloseTo(normal[1]);
  }
});

it.each([0, -1])('uses the start of the rotation curve for newborn lifetime %s', (lifetime) => {
  const curve = sampleCurve({
    points: [
      { time: 0, value: 0, tangent: 90 },
      { time: 1, value: 90, tangent: 90 },
    ],
  });
  const heading = particleHeading(0, 0.1, lifetime, curve, 10, 0, 1, 1);
  expect(heading[0]).toBeCloseTo(1);
  expect(heading[1]).toBeCloseTo(0);
});
