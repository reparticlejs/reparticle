import { tgpu, d } from 'typegpu';

/**
 * Remove a fraction of the selected velocity component over one timestep.
 *
 * Magnitude and spread are rates in inverse seconds. The particle's fixed
 * spreadFactor samples the rate; multiplying by seconds gives linear damping.
 * Cap damping at one so positive drag cannot reverse the selected component.
 * There is no lower clamp: a negative sampled rate increases that component.
 */
export const applyDrag = tgpu
  .fn(
    [d.f32, d.f32, d.f32, d.f32, d.f32, d.f32],
    d.f32,
  )((velocity, velocityToDamp, magnitude, spread, spreadFactor, seconds) => {
    'use gpu';
    const sampledRate = magnitude + spread * spreadFactor;
    const dampingFraction = Math.min(sampledRate * seconds, 1);
    return velocity - velocityToDamp * dampingFraction;
  })
  .$name('applyDrag');

/**
 * Apply drag to both axes and return the updated velocity.
 *
 * By default, damp the full vector. When the numeric directional flag is set,
 * project onto the modifier's unit direction and damp only that component;
 * perpendicular motion is preserved. Both axes share the same spread sample.
 */
export const applyDragVelocity = tgpu
  .fn(
    [d.vec2f, d.vec2f, d.f32, d.f32, d.f32, d.f32, d.f32],
    d.vec2f,
  )((velocity, direction, magnitude, spread, spreadFactor, seconds, directional) => {
    'use gpu';
    let velocityToDampX = velocity[0];
    let velocityToDampY = velocity[1];
    if (directional > 0.5) {
      // Project before changing either axis so both use the incoming velocity.
      const speedAlongDirection = velocity[0] * direction[0] + velocity[1] * direction[1];
      velocityToDampX = speedAlongDirection * direction[0];
      velocityToDampY = speedAlongDirection * direction[1];
    }
    return d.vec2f(
      applyDrag(velocity[0], velocityToDampX, magnitude, spread, spreadFactor, seconds),
      applyDrag(velocity[1], velocityToDampY, magnitude, spread, spreadFactor, seconds),
    );
  })
  .$name('applyDragVelocity');
