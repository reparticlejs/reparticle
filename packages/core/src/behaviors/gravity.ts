/** Gravity contributes acceleration on one axis; it does not integrate movement. */
export function applyGravity(acceleration: number, gravity: number): number {
  return acceleration + gravity;
}
