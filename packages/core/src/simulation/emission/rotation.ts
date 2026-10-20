/** Align local up to the shape's unit direction, in counterclockwise degrees. */
export function spawnRotation(directionX: number, directionY: number): number {
  return -Math.atan2(directionX, -directionY) * (180 / Math.PI);
}
