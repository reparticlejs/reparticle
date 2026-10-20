/**
 * Advance age by elapsed simulation seconds without clamping to lifetime.
 * The kernel checks expiration using this new age. Newborns receive a full
 * birth step too: their initial age is set directly to that step's duration.
 */
export function advanceAge(age: number, seconds: number): number {
  return age + seconds;
}

/**
 * Return a numeric lifetime flag: 1 while age <= lifetime, otherwise 0.
 * Both arguments are seconds. Equality survives; expiration begins strictly
 * after the boundary, so age zero with lifetime zero returns 1.
 *
 * This checks time only. The kernel combines it with the stored active flag
 * so empty slots stay inactive, and bypasses it for a newborn's first step.
 * Keep the result numeric because it is stored in the GPU state texture.
 */
export function particleAlive(age: number, lifetime: number): number {
  if (age > lifetime) {
    return 0;
  }
  return 1;
}
