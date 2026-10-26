import { tgpu, d } from 'typegpu';

import { spawnBox } from './box.ts';
import { spawnCircle } from './circle.ts';
import { spawnCone2D } from './cone2d.ts';
import { spawnMotion } from './motion.ts';
import { propertyVariation } from './variation.ts';

/**
 * Sample a local position and unit direction for the selected emission shape.
 * Unit speed preserves orientation even when the configured particle speed is
 * zero. Integration applies the emitter transform and actual speed afterward.
 */
export const sampleShape = tgpu
  .fn(
    [d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32],
    d.vec4f,
  )(
    (
      particleId,
      seed,
      shapeType,
      direction,
      spread,
      dimensionX,
      dimensionY,
      dimensionSpreadX,
      dimensionSpreadY,
    ) => {
      'use gpu';
      const sampledDimensionX =
        dimensionX + propertyVariation(particleId, seed, 12) * dimensionSpreadX;
      const sampledDimensionY =
        dimensionY + propertyVariation(particleId, seed, 13) * dimensionSpreadY;
      // Numeric shape IDs match the runtime emission configuration.
      if (shapeType === 1) {
        return d.vec4f(spawnCircle(particleId, seed, 0, 0, 1, sampledDimensionX));
      }
      if (shapeType === 2) {
        return d.vec4f(spawnBox(particleId, seed, 0, 0, 1, sampledDimensionX, sampledDimensionY));
      }
      if (shapeType === 3) {
        return d.vec4f(
          spawnCone2D(particleId, seed, 0, 0, 1, sampledDimensionX, sampledDimensionY),
        );
      }
      return d.vec4f(spawnMotion(particleId, seed, 0, 0, 1, direction, spread));
    },
  )
  .$name('sampleShape');
