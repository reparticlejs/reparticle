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
export function advanceRotation(
  accumulatedRotation: number,
  initialAngularVelocity: number,
  age: number,
  lifetime: number,
  curve: Float32Array,
  seconds: number,
): number {
  const segmentCount = 64;
  const normalizedAge = lifetime > 0 ? Math.max(0, Math.min(1, age / lifetime)) : 0;
  const samplePosition = normalizedAge * segmentCount;

  // At the endpoint, use the last interval with a blend of one.
  const segment = Math.min(Math.floor(samplePosition), segmentCount - 1);
  const blend = samplePosition - segment;
  const startMultiplier = curve[segment]!;
  const endMultiplier = curve[segment + 1]!;
  const multiplier = startMultiplier + (endMultiplier - startMultiplier) * blend;

  const rotationDelta = initialAngularVelocity * multiplier * seconds;
  return accumulatedRotation + rotationDelta;
}
