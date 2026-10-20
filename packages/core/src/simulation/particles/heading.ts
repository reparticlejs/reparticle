import { movementRotation } from './movement-rotation';

/**
 * Return the particle's visual heading as a unit vector [x, y].
 * Radial modifiers use it when the particle is exactly at their center.
 *
 * baseRotation is in counterclockwise degrees and already includes any
 * accumulated angular rotation supplied by the caller. Add the lifetime curve's
 * rotation, mirrored by handedness (+1 or -1), and optional movement alignment.
 * Movement uses velocity before this step's modifiers are applied.
 *
 * Age is sampled after the current step. The curve has 65 values over 64
 * intervals; clamp age/lifetime to [0, 1], using zero for nonpositive lifetime.
 */
export function particleHeading(
  baseRotation: number,
  age: number,
  lifetime: number,
  rotationCurve: Float32Array,
  velocityX: number,
  velocityY: number,
  orientToMovement: number,
  handedness: number,
): [number, number] {
  const segmentCount = 64;
  const normalizedAge = lifetime > 0 ? Math.max(0, Math.min(1, age / lifetime)) : 0;
  const samplePosition = normalizedAge * segmentCount;

  // At the endpoint, use the last interval with a blend of one.
  const segment = Math.min(Math.floor(samplePosition), segmentCount - 1);
  const blend = samplePosition - segment;
  const startRotation = rotationCurve[segment]!;
  const endRotation = rotationCurve[segment + 1]!;
  const lifetimeRotation = startRotation + (endRotation - startRotation) * blend;

  const movementAlignment = orientToMovement > 0.5 ? movementRotation(velocityX, velocityY) : 0;
  const rotationDegrees = baseRotation + lifetimeRotation * handedness + movementAlignment;

  // Canvas Y points down. Negate counterclockwise degrees, then rotate local up (-Y).
  const clockwiseRadians = (-rotationDegrees * Math.PI) / 180;
  return [Math.sin(clockwiseRadians), -Math.cos(clockwiseRadians)];
}
