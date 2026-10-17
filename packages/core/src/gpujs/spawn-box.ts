import { spawnVariation } from '../behaviors/spawn';
import type { ParticleTexel } from './layout';

/** Defold's zero-depth box: uniform interior, upward velocity in canvas coordinates. */
export function spawnBox(
  particleId: number,
  seed: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  width: number,
  height: number,
): ParticleTexel {
  const offsetX = (spawnVariation(particleId, seed) - 0.5) * width;
  const offsetY = (spawnVariation(particleId, seed + 173) - 0.5) * height;
  return [emitterX + offsetX, emitterY + offsetY, 0, -speed];
}
