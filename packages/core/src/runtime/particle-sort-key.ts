/** Quantize remaining lifetime against the emitter's authored maximum. */
export function particleSortKey(age: number, lifetime: number, maximumLifetime: number): number {
  const remaining = Math.fround(lifetime - age);
  // A nonpositive maximum has no useful normalization range; keep ties stable.
  if (maximumLifetime <= 0) {
    return 65535;
  }
  const range = Math.fround(1 / maximumLifetime);
  const relative = Math.fround(1 - Math.fround(remaining * range));
  return Math.trunc(Math.max(0, Math.min(65535, Math.fround(relative * 65535))));
}
