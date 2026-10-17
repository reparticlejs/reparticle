/** Deterministic variation for a particle slot and emission batch. */
export function spawnVariation(particleId: number, seed: number): number {
  const hash = Math.sin(particleId * 12.9898 + seed * 0.137) * 43758.5453;
  return hash - Math.floor(hash);
}

/** Spread is centered on the emitter's direction, measured in radians. */
export function spawnDirection(direction: number, spread: number, variation: number): number {
  return direction + (variation - 0.5) * spread;
}

/** Preserve the prototype's speed variation between 70% and 100%. */
export function spawnSpeed(speed: number, variation: number): number {
  return speed * (0.7 + variation * 0.3);
}
