import { tgpu, d } from 'typegpu';

import { readModifier } from '#simulation/resources.ts';

import { applyAcceleration } from './acceleration.ts';
import { applyDragVelocity } from './drag.ts';
import { applyNoise } from './noise.ts';
import { applyRadial } from './radial.ts';
import { applyVortex } from './vortex.ts';

/**
 * Read one packed record and apply it to velocity.
 * Record layout matches runtime/modifiers/list.ts:
 * [type, magnitude, spread, centerX, centerY, directionX, directionY, cutoff, directional,
 * frequency, phase, seed]. Noise uses directional for handedness and direction for its basis.
 * The vectors compile to shader values, not per-particle JavaScript objects.
 */
export const dispatchModifier = tgpu
  .fn(
    [d.vec2f, d.vec2f, d.vec2f, d.f32, d.f32, d.f32],
    d.vec2f,
  )((position, velocity, heading, spreadFactor, seconds, offset) => {
    'use gpu';
    const accelerationType = 0;
    const dragType = 1;
    const radialType = 2;
    const vortexType = 3;
    const noiseType = 4;
    const type = readModifier(offset);
    const magnitude = readModifier(offset + 1);
    const spread = readModifier(offset + 2);
    const directionX = readModifier(offset + 5);
    const directionY = readModifier(offset + 6);
    if (type === accelerationType) {
      return d.vec2f(
        velocity[0] + applyAcceleration(directionX, magnitude, spread, spreadFactor) * seconds,
        velocity[1] + applyAcceleration(directionY, magnitude, spread, spreadFactor) * seconds,
      );
    }
    if (type === dragType) {
      const directional = readModifier(offset + 8);
      return d.vec2f(
        applyDragVelocity(
          velocity,
          d.vec2f(directionX, directionY),
          magnitude,
          spread,
          spreadFactor,
          seconds,
          directional,
        ),
      );
    }
    const centerX = readModifier(offset + 3);
    const centerY = readModifier(offset + 4);
    const maxDistance = readModifier(offset + 7);
    let acceleration = d.vec2f(0, 0);
    if (type === noiseType) {
      const force = applyNoise(
        position,
        d.vec2f(centerX, centerY),
        d.vec2f(directionX, directionY),
        readModifier(offset + 9),
        readModifier(offset + 10),
        readModifier(offset + 11),
        readModifier(offset + 8),
      );
      acceleration = d.vec2f(
        force.x * (magnitude + spread * spreadFactor),
        force.y * (magnitude + spread * spreadFactor),
      );
    } else if (type === radialType) {
      // At the center, radial acceleration follows the particle's heading.
      acceleration = applyRadial(
        position[0],
        position[1],
        centerX,
        centerY,
        heading[0],
        heading[1],
        magnitude,
        spread,
        spreadFactor,
        maxDistance,
      );
    } else if (type === vortexType) {
      // At the center, vortex acceleration uses the modifier's direction.
      acceleration = applyVortex(
        position[0],
        position[1],
        centerX,
        centerY,
        directionX,
        directionY,
        magnitude,
        spread,
        spreadFactor,
        maxDistance,
      );
    } else {
      return d.vec2f(velocity);
    }
    return d.vec2f(
      velocity[0] + acceleration[0] * seconds,
      velocity[1] + acceleration[1] * seconds,
    );
  })
  .$name('dispatchModifier');
