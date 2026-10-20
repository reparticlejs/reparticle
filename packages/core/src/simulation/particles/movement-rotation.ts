/**
 * Align local up (-Y) with the velocity before this step's modifiers.
 * Return counterclockwise degrees: up is 0°, right is -90°, left is +90°.
 *
 * Speeds at or below 0.01 simulation units per second use zero rotation.
 * Directions almost straight down use +180° consistently instead of switching
 * between -180° and +180° as the horizontal component crosses zero.
 */
export function movementRotation(velocityX: number, velocityY: number): number {
  const minimumSpeedSquared = 0.0001; // (0.01 units/second)².
  const downwardTolerance = 0.0001; // Dimensionless tolerance for normalized Y.
  const speedSquared = velocityX * velocityX + velocityY * velocityY;
  if (speedSquared <= minimumSpeedSquared) {
    return 0;
  }

  const speed = Math.sqrt(speedSquared);
  const directionY = velocityY / speed;
  if (Math.abs(1 - directionY) <= downwardTolerance) {
    return 180;
  }

  // Measure from local up, then reverse the canvas clockwise sign.
  const clockwiseRadians = Math.atan2(velocityX, -velocityY);
  const radiansToDegrees = 180 / Math.PI;

  return -clockwiseRadians * radiansToDegrees;
}
