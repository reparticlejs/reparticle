const MAX_SORT_KEY = 65535;

/**
 * Convert remaining lifetime into a 16-bit key for ascending draw-order sorting.
 * More remaining lifetime produces a smaller key and therefore draws first.
 * The emitter's authored maximum defines the range; values outside it are clamped.
 *
 * Float32 rounding at each calculation stage is intentional: changing it can
 * move a value across a quantization boundary and alter ordering or ties.
 * Equal keys are resolved by the stable ordering in ParticleOrder.
 */
export function particleSortKey(age: number, lifetime: number, maximumLifetime: number): number {
  // A nonpositive maximum has no useful normalization range; keep ties stable.
  if (maximumLifetime <= 0) {
    return MAX_SORT_KEY;
  }

  const remainingLifetime = Math.fround(lifetime - age);
  const inverseMaximumLifetime = Math.fround(1 / maximumLifetime);
  const remainingFraction = Math.fround(remainingLifetime * inverseMaximumLifetime);
  const orderFraction = Math.fround(1 - remainingFraction);

  const scaledKey = Math.fround(orderFraction * MAX_SORT_KEY);
  const clampedKey = Math.max(0, Math.min(MAX_SORT_KEY, scaledKey));
  return Math.trunc(clampedKey);
}
