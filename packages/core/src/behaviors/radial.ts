/** Radial acceleration: constant strength inside an inclusive distance cutoff. */
export function applyRadial(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  fallbackX: number,
  fallbackY: number,
  magnitude: number,
  spread: number,
  factor: number,
  maxDistance: number,
): [number, number] {
  const dx = x - centerX;
  const dy = y - centerY;
  const squaredDistance = dx * dx + dy * dy;
  if (squaredDistance > maxDistance * maxDistance) {
    return [0, 0];
  }
  const strength = magnitude + spread * factor;
  if (squaredDistance === 0) {
    return [fallbackX * strength, fallbackY * strength];
  }
  const distance = Math.sqrt(squaredDistance);
  return [(dx / distance) * strength, (dy / distance) * strength];
}
