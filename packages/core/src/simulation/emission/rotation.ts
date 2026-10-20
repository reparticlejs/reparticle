/**
 * Find the initial rotation that aligns local up (-Y) with a spawn direction.
 *
 * Return counterclockwise degrees: up is 0°, right is -90°, and left is +90°.
 * The shape supplies a nonzero direction even when particle speed is zero;
 * its length does not affect the angle.
 */
export function spawnRotation(directionX: number, directionY: number): number {
  // Swapping the usual atan2 arguments measures from -Y instead of +X.
  const clockwiseRadians = Math.atan2(directionX, -directionY);
  const radiansToDegrees = 180 / Math.PI;

  return -clockwiseRadians * radiansToDegrees;
}
