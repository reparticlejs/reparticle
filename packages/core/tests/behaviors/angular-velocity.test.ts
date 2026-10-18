import { expect, it } from 'vitest';

import { advanceRotation } from '#src/behaviors/angular-velocity.js';
import { sampleCurve } from '#src/curves/sample-curve.js';

it('integrates signed degrees per second independently of the frame rate', () => {
  const curve = sampleCurve(1);
  for (const fps of [30, 60, 120]) {
    let rotation = 30;
    for (let frame = 0; frame < fps; frame++) {
      rotation = advanceRotation(rotation, -180, (frame + 1) / fps, 2, curve, 1 / fps);
    }
    expect(rotation).toBeCloseTo(-150);
  }
});

it('multiplies birth speed by the sampled lifetime curve, including reversal', () => {
  const curve = sampleCurve({
    points: [
      { time: 0, value: 1, tangent: -2 },
      { time: 1, value: -1, tangent: -2 },
    ],
  });
  expect(advanceRotation(0, 100, 0, 2, curve, 0.1)).toBe(10);
  expect(advanceRotation(0, 100, 1, 2, curve, 0.1)).toBe(0);
  expect(advanceRotation(0, 100, 2, 2, curve, 0.1)).toBe(-10);
  expect(advanceRotation(20, 100, 0, 0, curve, 0)).toBe(20);
});
