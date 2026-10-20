/** Position under constant acceleration, using the velocity at the start of the step. */
export function advancePosition(
  position: number,
  velocity: number,
  acceleration: number,
  seconds: number,
): number {
  return position + velocity * seconds + 0.5 * acceleration * seconds * seconds;
}

/** Velocity is integrated once after all acceleration contributions are accumulated. */
export function advanceVelocity(velocity: number, acceleration: number, seconds: number): number {
  return velocity + acceleration * seconds;
}
