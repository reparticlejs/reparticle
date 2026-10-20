import type { ParticleTexel } from '#types/layout.js';

import { circleAngle, circleRadius } from '../behaviors/circle';
import { spawnVariation } from '../behaviors/spawn';

/** Circle emission: interior position and outward radial velocity. */
export function spawnCircle(
  particleId: number,
  seed: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  diameter: number,
): ParticleTexel {
  const angle = circleAngle(spawnVariation(particleId, seed));
  const radius = circleRadius(spawnVariation(particleId, seed + 173), diameter);
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  return [
    emitterX + directionX * radius,
    emitterY + directionY * radius,
    directionX * speed,
    directionY * speed,
  ];
}
