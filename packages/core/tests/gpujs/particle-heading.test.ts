import { expect, it } from 'vitest';

import { sampleCurve } from '#src/curves/sample-curve.js';
import { particleHeading } from '#src/gpujs/particle-heading.js';

it('combines initial rotation with the lifetime rotation curve', () => {
  const curve = sampleCurve({
    points: [
      { time: 0, value: 0, tangent: 90 },
      { time: 1, value: 90, tangent: 90 },
    ],
  });
  const heading = particleHeading(45, 1, 2, curve, 0, 0, 0);
  expect(heading[0]).toBeCloseTo(-1);
  expect(heading[1]).toBeCloseTo(0);
});

it('follows movement with Defold low-speed and opposite-direction fallbacks', () => {
  const curve = sampleCurve(0);
  expect(particleHeading(0, 0, 2, curve, 10, 0, 1)).toEqual([1, 0]);
  const stopped = particleHeading(90, 0, 2, curve, 0.001, 0, 1);
  expect(stopped[0]).toBeCloseTo(-1);
  expect(stopped[1]).toBeCloseTo(0);
  const reversed = particleHeading(90, 0, 2, curve, 0, 10, 1);
  expect(reversed[0]).toBeCloseTo(1);
  expect(reversed[1]).toBeCloseTo(0);
});
