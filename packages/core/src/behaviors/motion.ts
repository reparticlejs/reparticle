/** Position after a time step with constant velocity. Units are chosen by the caller. */
export function advancePosition(position: number, velocity: number, seconds: number): number {
  return position + velocity * seconds;
}

/** Position under constant acceleration, including movement during this time step. */
export function advancePositionWithGravity(
  position: number,
  velocity: number,
  gravity: number,
  seconds: number,
): number {
  return position + velocity * seconds + 0.5 * gravity * seconds * seconds;
}

/** Velocity after a time step with constant gravity. */
export function advanceVelocity(velocity: number, gravity: number, seconds: number): number {
  return velocity + gravity * seconds;
}
