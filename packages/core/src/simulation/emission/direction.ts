/**
 * Produce a repeatable sample in [0, 1) from a particle slot and seed.
 *
 * Shape sampling uses this value for positions and directions. Changing the
 * seed varies the pattern when slots are reused; the same inputs reproduce
 * the same sample within the same execution backend.
 */
export function spawnVariation(particleId: number, seed: number): number {
  // Fixed hash coefficients mix the slot and seed, then amplify the sine value.
  // These are not physical units; changing them changes every seeded pattern.
  const particleWeight = 12.9898;
  const seedWeight = 0.137;
  const hashScale = 43758.5453;
  const phase = particleId * particleWeight + seed * seedWeight;
  const hash = Math.sin(phase) * hashScale;

  // Floor extracts a nonnegative fractional part even when the hash is negative.
  return hash - Math.floor(hash);
}

/**
 * Map a sample in [0, 1) to an angle centered on direction.
 *
 * Both direction and spread are radians. Spread is the full angular width:
 * a sample of 0.5 points along direction, and zero spread fixes every angle
 * to direction. The result is not wrapped to a single revolution.
 */
export function spawnDirection(direction: number, spread: number, variation: number): number {
  const centeredVariation = variation - 0.5;
  const angleOffset = centeredVariation * spread;

  return direction + angleOffset;
}
