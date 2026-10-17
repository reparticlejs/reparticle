/** Defold Z-axis vortex in canvas coordinates: positive magnitude turns counterclockwise. */
export function applyVortex(
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
  return [(dy / distance) * strength, (-dx / distance) * strength];
}
