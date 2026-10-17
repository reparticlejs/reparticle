import type { ParticleTexel } from '#types/layout.js';

import { spawnDirection, spawnVariation } from '../behaviors/spawn';

// Keep spawn locals in their own function: GPU.js misreads block locals when
// minifiers rename them to match a kernel parameter.
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
  return [emitterX, emitterY, Math.cos(angle) * speed, Math.sin(angle) * speed];
}
