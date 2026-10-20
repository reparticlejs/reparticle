import type { ParticleTexel } from '#types/layout.js';

import { spawnVariation } from '../behaviors/spawn';

/** Filled triangle: tip at the emitter, velocity away from the tip. */
export function spawnCone2D(
  particleId: number,
  seed: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  width: number,
  height: number,
): ParticleTexel {
  const first = spawnVariation(particleId, seed);
  const second = spawnVariation(particleId, seed + 173);
  const offsetX = (second - first) * width * 0.5;
  let distanceUp = (first + second) * height;
  // Fold the upper half of the sampled parallelogram into the triangle.
  if (distanceUp > height) {
    distanceUp = 2 * height - distanceUp;
  }
  const length = Math.sqrt(offsetX * offsetX + distanceUp * distanceUp);
  if (length === 0) {
    return [emitterX, emitterY, 0, -speed];
  }
  return [
    emitterX + offsetX,
    emitterY - distanceUp,
    (offsetX / length) * speed,
    (-distanceUp / length) * speed,
  ];
}
