/** Current visual orientation, used by radial force at its exact center. */
export function particleHeading(
  initialRotation: number,
  age: number,
  lifetime: number,
  rotationCurve: Float32Array,
  velocityX: number,
  velocityY: number,
  orientToMovement: number,
  handedness: number,
): [number, number] {
  const position = Math.max(0, Math.min(1, age / lifetime)) * 64;
  const segment = Math.min(Math.floor(position), 63);
  const left = rotationCurve[segment]!;
  const rotation = left + (rotationCurve[segment + 1]! - left) * (position - segment);
  const angle = (-(initialRotation + rotation * handedness) * Math.PI) / 180;
  const x = Math.sin(angle);
  const y = -Math.cos(angle);
  const speedSquared = velocityX * velocityX + velocityY * velocityY;
  if (orientToMovement > 0.5 && speedSquared > 0.0001) {
    const speed = Math.sqrt(speedSquared);
    const directionX = velocityX / speed;
    const directionY = velocityY / speed;
    if (Math.abs(1 - directionY) <= 0.0001) {
      return [-x, -y];
    }
    return [-directionY * x - directionX * y, directionX * x - directionY * y];
  }
  return [x, y];
}
