/** Age advances for existing slots; newly spawned particles start at zero. */
export function advanceAge(age: number, seconds: number): number {
  return age + seconds;
}

/** Numeric activity flag for GPU.js helpers; a positive birth lifetime identifies initialized slots. */
export function particleAlive(age: number, lifetime: number): number {
  if (lifetime <= 0 || age >= lifetime) {
    return 0;
  }
  return 1;
}
