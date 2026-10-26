/** Stable random streams. Changing an ID changes the particles produced by existing seeds. */
export const VARIATION_STREAM = {
  speed: 1,
  lifetime: 2,
  size: 3,
  rotation: 4,
  red: 5,
  green: 6,
  blue: 7,
  alpha: 8,
  modifier: 14,
  angularVelocity: 15,
  stretchX: 16,
  stretchY: 17,
} as const;

/**
 * Produce repeatable variation in [-1, 1] for a particle property.
 *
 * Callers use `base + variation * spread`. A stable stream ID gives each
 * property (speed, lifetime, color, etc.) a separate sequence for the same
 * particle slot and seed, without maintaining random-generator state.
 *
 * With runtime seeds in [0, 65535] and the assigned property streams, integer
 * mixing stays below 2^24, where float32 represents integers exactly. CPU
 * lifetime tracking and GPU spawning therefore use the same integer hash.
 */
export function propertyVariation(particleId: number, seed: number, stream: number): number {
  'use gpu';
  // A prime modulus bounds each mixing round to [0, 65520].
  const modulus = 65521;
  const seedWeight = 127;
  const streamWeight = 8191;
  const midpoint = 32760; // Half of the maximum hash value: maps to zero.
  let hash = ((particleId % modulus) + seed * seedWeight + stream * streamWeight) % modulus;
  // Fixed mixing coefficients scramble nearby inputs. Keep their values and
  // operation order stable so existing seeds reproduce the same particles.
  hash = (hash * 251 + 17) % modulus;
  hash = (hash * 241 + 31) % modulus;
  const finalMultiplier = (hash % 127) + 1;
  hash = (hash * finalMultiplier + 97) % modulus;
  // Map both endpoints, 0 and 65520, to -1 and +1 respectively.
  return hash / midpoint - 1;
}
