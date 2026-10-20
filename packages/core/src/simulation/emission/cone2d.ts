import type { ParticleTexel } from '#types/layout.js';

import { spawnVariation } from './direction';

/**
 * Spawn uniformly inside a triangle with its tip at the emitter.
 *
 * dimensionX is the full base width; dimensionY is the height along local -Y.
 * Two samples choose a point in a parallelogram formed by the triangle's sides.
 * Folding the half beyond the base back into the triangle preserves uniform area.
 *
 * Return [x, y, velocityX, velocityY]. Velocity points away from the tip,
 * normalized to the supplied speed. At the tip, where that direction is
 * undefined, use local -Y. The integration kernel applies the emitter's
 * rotation, scale, and inherited velocity afterward.
 */
export function spawnCone2D(
  particleId: number,
  seed: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  dimensionX: number,
  dimensionY: number,
): ParticleTexel {
  // Separate samples along the left and right sides avoid a fixed center line.
  // Keep the arbitrary offset stable to preserve seeded particle positions.
  const sideSeedOffset = 173;
  const leftSample = spawnVariation(particleId, seed);
  const rightSample = spawnVariation(particleId, seed + sideSeedOffset);
  const offsetX = (rightSample - leftSample) * dimensionX * 0.5;
  let distanceUp = (leftSample + rightSample) * dimensionY;

  // Reflect across the base without changing the horizontal offset.
  if (distanceUp > dimensionY) {
    distanceUp = 2 * dimensionY - distanceUp;
  }

  const distanceFromTip = Math.sqrt(offsetX * offsetX + distanceUp * distanceUp);
  if (distanceFromTip === 0) {
    return [emitterX, emitterY, 0, -speed];
  }

  const velocityX = (offsetX / distanceFromTip) * speed;
  const velocityY = (-distanceUp / distanceFromTip) * speed;

  return [emitterX + offsetX, emitterY - distanceUp, velocityX, velocityY];
}
