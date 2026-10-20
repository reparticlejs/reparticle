/** Age advances by the simulation step, including the birth step. */
export function advanceAge(age: number, seconds: number): number {
  return age + seconds;
}

/** Existing particles expire strictly after their lifetime; slot activity is tracked separately. */
export function particleAlive(age: number, lifetime: number): number {
  if (age > lifetime) {
    return 0;
  }
  return 1;
}
