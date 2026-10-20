/** Acceleration along one component of the modifier's direction. */
export function applyAcceleration(
  direction: number,
  magnitude: number,
  spread: number,
  factor: number,
): number {
  return direction * (magnitude + spread * factor);
}
