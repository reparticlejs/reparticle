/** Age advances for existing slots; newly spawned particles start at zero. */
export function advanceAge(age: number, seconds: number): number {
  return age + seconds;
}

/** Numeric activity flag for GPU.js helpers; lifetime is captured at birth. */
export function particleAlive(initialized: number, age: number, lifetime: number): number {
  if (initialized < 0.5 || age >= lifetime) {
    return 0;
  }
  return 1;
}
