import type { ParticleTexel } from '#types/layout.js';

import { spawnVariation } from './direction';

/**
 * Spawn inside a rectangle centered on the emitter.
 *
 * Dimensions are the full width and height in simulation units. Each axis is
 * sampled separately across [-dimension / 2, dimension / 2]; a zero dimension
 * collapses that axis to the emitter's center.
 *
 * Return [x, y, velocityX, velocityY]. All particles travel along local -Y,
 * regardless of their spawn position. The integration kernel applies the
 * emitter's rotation, scale, and inherited velocity afterward.
 */
export function spawnBox(
  particleId: number,
  seed: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  dimensionX: number,
  dimensionY: number,
): ParticleTexel {
  // Use a different seed for Y so both axes do not sample the same diagonal.
  const offsetX = (spawnVariation(particleId, seed) - 0.5) * dimensionX;
  const offsetY = (spawnVariation(particleId, seed + 173) - 0.5) * dimensionY;

  return [emitterX + offsetX, emitterY + offsetY, 0, -speed];
}
