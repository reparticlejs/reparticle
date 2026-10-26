import { tgpu, d } from 'typegpu';

import { spawnVariation } from './direction.ts';

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
export const spawnBox = tgpu
  .fn(
    [d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32],
    d.vec4f,
  )((particleId, seed, emitterX, emitterY, speed, dimensionX, dimensionY) => {
    'use gpu';
    // Use a different seed for Y so both axes do not sample the same diagonal.
    const offsetX = (spawnVariation(particleId, seed) - 0.5) * dimensionX;
    const offsetY = (spawnVariation(particleId, seed + 173) - 0.5) * dimensionY;
    return d.vec4f(emitterX + offsetX, emitterY + offsetY, 0, -speed);
  })
  .$name('spawnBox');
