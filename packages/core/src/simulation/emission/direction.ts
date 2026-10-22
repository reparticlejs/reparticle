/**
 * Produce a repeatable sample in [0, 1) for spawn positions and directions.
 *
 * Mix the slot and seed as two small integers instead of taking the sine of
 * a large slot-dependent angle. All integer intermediates stay below 2^24,
 * where float32 is exact; only the final normalization needs rounding.
 * Shape callers may offset the seed to obtain a second coordinate.
 */
export function spawnVariation(particleId: number, seed: number): number {
  // Two base-4093 digits cover every supported slot without a short slot cycle.
  // Even the largest square and the combined result fit exactly in float32.
  const base = 4093;
  let left = (Math.floor(particleId / base) + Math.floor(seed / base)) % base;
  let right = ((particleId % base) + (seed % base)) % base;

  // Six Feistel rounds: mix one digit into the other, then swap them.
  // Each round is reversible, so distinct slots retain distinct integer codes
  // for a fixed seed. The round salt breaks symmetry between repeated rounds.
  for (let round = 0; round < 6; round++) {
    const square = (right * right) % base;
    const mixed = (square * 251 + round * 1013) % base;
    const next = (left + mixed) % base;
    left = right;
    right = next;
  }

  return (left * base + right) / (base * base);
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
