import { movementRotation } from './movement-rotation';

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
  const normalizedAge = lifetime > 0 ? Math.max(0, Math.min(1, age / lifetime)) : 0;
  const position = normalizedAge * 64;
  const segment = Math.min(Math.floor(position), 63);
  const left = rotationCurve[segment]!;
  const rotation = left + (rotationCurve[segment + 1]! - left) * (position - segment);
  const movement = orientToMovement > 0.5 ? movementRotation(velocityX, velocityY) : 0;
  const angle = (-(initialRotation + rotation * handedness + movement) * Math.PI) / 180;
  return [Math.sin(angle), -Math.cos(angle)];
}
