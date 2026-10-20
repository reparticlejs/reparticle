/** Cap damping at one; negative drag magnitude accelerates. */
export function applyDrag(
  velocity: number,
  projectedVelocity: number,
  magnitude: number,
  spread: number,
  factor: number,
  seconds: number,
): number {
  return velocity - projectedVelocity * Math.min((magnitude + spread * factor) * seconds, 1);
}
