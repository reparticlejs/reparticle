/** Align local up to pre-modifier velocity, with Defold's rest and reversal fallbacks. */
export function movementRotation(velocityX: number, velocityY: number): number {
  const speedSquared = velocityX * velocityX + velocityY * velocityY;
  if (speedSquared <= 0.0001) {
    return 0;
  }
  const directionY = velocityY / Math.sqrt(speedSquared);
  if (Math.abs(1 - directionY) <= 0.0001) {
    return 180;
  }
  return -Math.atan2(velocityX, -velocityY) * (180 / Math.PI);
}
