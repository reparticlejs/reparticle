import type { ParticleTexel } from '#types/layout.js';

import { spawnDirection, spawnVariation } from './direction';

/**
 * Spawn at the emitter's position with velocity inside an angular spread.
 *
 * Direction and spread are radians; spread is the full width centered on
 * direction. Zero radians points along +X, and positive angles turn toward +Y
 * (clockwise on a canvas). Zero spread gives every particle the same direction.
 *
 * Return [x, y, velocityX, velocityY]. The sampled unit direction is multiplied
 * by speed in simulation units per second. The integration kernel applies the
 * emitter's rotation, scale, and inherited velocity afterward.
 */
export function spawnMotion(
  particleId: number,
  seed: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  direction: number,
  spread: number,
): ParticleTexel {
  const variation = spawnVariation(particleId, seed);
  const angle = spawnDirection(direction, spread, variation);
  const velocityX = Math.cos(angle) * speed;
  const velocityY = Math.sin(angle) * speed;

  return [emitterX, emitterY, velocityX, velocityY];
}
