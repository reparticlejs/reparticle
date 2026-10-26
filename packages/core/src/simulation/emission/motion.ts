import { tgpu, d } from 'typegpu';

import { spawnVariation } from './direction.ts';
import { spawnDirection } from './direction.ts';

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
export const spawnMotion = tgpu
  .fn(
    [d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32],
    d.vec4f,
  )((particleId, seed, emitterX, emitterY, speed, direction, spread) => {
    'use gpu';
    const variation = spawnVariation(particleId, seed);
    const angle = spawnDirection(direction, spread, variation);
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    return d.vec4f(emitterX, emitterY, velocityX, velocityY);
  })
  .$name('spawnMotion');
