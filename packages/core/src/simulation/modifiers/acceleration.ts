/**
 * Return one axis of acceleration, in simulation units per second squared.
 *
 * directionComponent is the X or Y component of the modifier's unit direction
 * after its transform. Magnitude is sampled by the runtime; spreadFactor is
 * the particle's fixed birth sample in [-1, 1]. Both axes use the same factor
 * so variation changes strength without changing direction.
 *
 * A negative sampled magnitude reverses acceleration. The caller multiplies
 * the result by elapsed seconds and adds it to that axis's velocity.
 */
export function applyAcceleration(
  directionComponent: number,
  magnitude: number,
  spread: number,
  spreadFactor: number,
): number {
  const sampledMagnitude = magnitude + spread * spreadFactor;

  return directionComponent * sampledMagnitude;
}
