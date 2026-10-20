import type { ParticleTexel } from '#types/layout.js';

import { spawnVariation } from './direction';

/**
 * Spawn uniformly across a disk centered on the emitter.
 *
 * Diameter is the full width in simulation units. Angle and radius use separate
 * samples; square-root radius sampling gives equal areas equal probability,
 * rather than concentrating particles near the center.
 *
 * Return [x, y, velocityX, velocityY]. The sampled direction controls both the
 * position offset and radial velocity. A zero diameter places every birth at
 * the center while preserving its direction. The integration kernel applies
 * the emitter's rotation, scale, and inherited velocity afterward.
 */
export function spawnCircle(
  particleId: number,
  seed: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  diameter: number,
): ParticleTexel {
  // 2π radians (360°) maps a sample in [0, 1) around the full circle.
  const fullCircle = 2 * Math.PI;
  // An arbitrary, fixed offset gives radius a different sample from angle.
  // Keep it stable so the same particle ID and seed reproduce the same position.
  const radiusSeedOffset = 173;

  const angle = spawnVariation(particleId, seed) * fullCircle;
  const radius = Math.sqrt(spawnVariation(particleId, seed + radiusSeedOffset)) * diameter * 0.5;

  // Share the radial unit vector between position and velocity.
  const directionX = Math.cos(angle);
  const directionY = Math.sin(angle);
  const offsetX = directionX * radius;
  const offsetY = directionY * radius;
  const velocityX = directionX * speed;
  const velocityY = directionY * speed;

  return [emitterX + offsetX, emitterY + offsetY, velocityX, velocityY];
}
