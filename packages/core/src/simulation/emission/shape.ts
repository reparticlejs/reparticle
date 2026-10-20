import type { ParticleTexel } from '#types/layout.js';

import { spawnBox } from './box';
import { spawnCircle } from './circle';
import { spawnCone2D } from './cone2d';
import { spawnMotion } from './motion';
import { propertyVariation } from './variation';

/**
 * Sample a local position and unit direction for the selected emission shape.
 * Unit speed preserves orientation even when the configured particle speed is
 * zero. Integration applies the emitter transform and actual speed afterward.
 */
export function sampleShape(
  particleId: number,
  seed: number,
  shapeType: number,
  direction: number,
  spread: number,
  dimensionX: number,
  dimensionY: number,
  dimensionSpreadX: number,
  dimensionSpreadY: number,
): ParticleTexel {
  const sampledDimensionX = dimensionX + propertyVariation(particleId, seed, 12) * dimensionSpreadX;
  const sampledDimensionY = dimensionY + propertyVariation(particleId, seed, 13) * dimensionSpreadY;

  // Numeric shape IDs match the runtime emission configuration.
  if (shapeType === 1) {
    return spawnCircle(particleId, seed, 0, 0, 1, sampledDimensionX);
  }
  if (shapeType === 2) {
    return spawnBox(particleId, seed, 0, 0, 1, sampledDimensionX, sampledDimensionY);
  }
  if (shapeType === 3) {
    return spawnCone2D(particleId, seed, 0, 0, 1, sampledDimensionX, sampledDimensionY);
  }
  return spawnMotion(particleId, seed, 0, 0, 1, direction, spread);
}
