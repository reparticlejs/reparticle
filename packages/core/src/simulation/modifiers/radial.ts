/**
 * Return radial acceleration [x, y] in simulation units per second squared.
 *
 * Positive sampled magnitude pushes away from the center; negative magnitude
 * pulls toward it. Strength stays constant with distance, including exactly
 * maxDistance. Outside that radius, acceleration is zero.
 *
 * At the exact center there is no radial direction, so use the particle's unit
 * heading instead. A zero maxDistance therefore affects only that center.
 * The caller multiplies acceleration by elapsed seconds and adds it to velocity.
 */
export function applyRadial(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  headingX: number,
  headingY: number,
  magnitude: number,
  spread: number,
  spreadFactor: number,
  maxDistance: number,
): [number, number] {
  const offsetX = x - centerX;
  const offsetY = y - centerY;
  const distanceSquared = offsetX * offsetX + offsetY * offsetY;
  const maxDistanceSquared = maxDistance * maxDistance;

  // Check the cutoff before normalizing, avoiding a square root outside the radius.
  if (distanceSquared > maxDistanceSquared) {
    return [0, 0];
  }

  const sampledMagnitude = magnitude + spread * spreadFactor;
  if (distanceSquared === 0) {
    return [headingX * sampledMagnitude, headingY * sampledMagnitude];
  }

  const distance = Math.sqrt(distanceSquared);
  const directionX = offsetX / distance;
  const directionY = offsetY / distance;

  return [directionX * sampledMagnitude, directionY * sampledMagnitude];
}
