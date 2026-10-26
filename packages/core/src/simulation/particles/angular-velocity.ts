import { tgpu, d } from 'typegpu';

import { readCurve } from '#simulation/resources.ts';

/**
 * Advance accumulated rotation in degrees by one timestep.
 *
 * Initial angular velocity is captured at birth in degrees per second. The
 * lifetime curve multiplies that velocity: zero stops rotation, and a negative
 * multiplier reverses it. Rotation accumulates without wrapping at 360°.
 *
 * Age is the particle's age after this step. Clamp its lifetime fraction to
 * [0, 1]; a nonpositive lifetime uses the curve's first value. The curve holds
 * 65 samples across 64 intervals, matching sampleCurve().
 */
export const advanceRotation = tgpu
  .fn(
    [d.f32, d.f32, d.f32, d.f32, d.f32, d.f32],
    d.f32,
  )((accumulatedRotation, initialAngularVelocity, age, lifetime, curve, seconds) => {
    'use gpu';
    const segmentCount = 64;
    let normalizedAge = d.f32(0);
    if (lifetime > 0) {
      normalizedAge = Math.max(0, Math.min(1, age / lifetime));
    }
    const samplePosition = normalizedAge * segmentCount;
    // At the endpoint, use the last interval with a blend of one.
    const segment = Math.min(Math.floor(samplePosition), segmentCount - 1);
    const blend = samplePosition - segment;
    const startMultiplier = readCurve(curve, segment);
    const endMultiplier = readCurve(curve, segment + 1);
    const multiplier = startMultiplier + (endMultiplier - startMultiplier) * blend;
    const rotationDelta = initialAngularVelocity * multiplier * seconds;
    return accumulatedRotation + rotationDelta;
  })
  .$name('advanceRotation');
