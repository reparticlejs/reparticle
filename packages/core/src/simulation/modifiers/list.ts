import { tgpu, d } from 'typegpu';

import { readModifier } from '#simulation/resources.ts';

import { dispatchModifier } from './dispatch.ts';

/**
 * Apply the packed modifier list in order. Each entry receives the velocity
 * produced by the previous one; position advances only after the entire list.
 * The runtime writes emitter modifiers first, followed by effect modifiers.
 */
export const applyModifiers = tgpu
  .fn(
    [d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32],
    d.vec2f,
  )((x, y, velocityX, velocityY, headingX, headingY, spreadFactor, seconds) => {
    'use gpu';
    const count = readModifier(0);
    const headerSize = 2;
    const recordSize = 9;
    const position = d.vec2f(x, y);
    const heading = d.vec2f(headingX, headingY);
    let velocity = d.vec2f(velocityX, velocityY);
    // Fixed GPU loop bound: up to 64 emitter and 64 effect modifiers.
    for (let index = 0; index < 128; index++) {
      if (index >= count) {
        break;
      }
      const offset = headerSize + index * recordSize;
      velocity = dispatchModifier(position, velocity, heading, spreadFactor, seconds, offset);
    }
    return d.vec2f(velocity);
  })
  .$name('applyModifiers');
