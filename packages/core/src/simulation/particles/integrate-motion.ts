import { tgpu, d } from 'typegpu';

import { applyModifiers } from '../modifiers/list.ts';
import { readModifier } from '../resources.ts';
import { advanceRotation } from './angular-velocity.ts';
import { particleHeading } from './heading.ts';

/**
 * Advance one particle with semi-implicit Euler integration:
 * apply modifiers to velocity first, then move using the resulting velocity.
 *
 * Both newborn and surviving particles use this step. The caller supplies age
 * after this step and rotation accumulated before it; newborns start with age
 * equal to seconds and accumulated rotation zero. Expiration is handled by the
 * kernel so a newborn always receives its first step.
 *
 * Position is in simulation units, velocity in units per second, and rotations
 * in degrees. Return [x, y, velocityX, velocityY]. This function does not update
 * stored age or rotation; their texture bands are written separately.
 */
export const integrateMotion = tgpu
  .fn(
    [
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
    ],
    d.vec4f,
  )(
    (
      x,
      y,
      velocityX,
      velocityY,
      ageAfterStep,
      lifetime,
      initialRotation,
      accumulatedRotation,
      initialAngularVelocity,
      spreadFactor,
      handedness,
      seconds,
      orientToMovement,
      orientToAngularVelocity,
      rotationCurve,
      angularVelocityCurve,
    ) => {
      'use gpu';
      const modifierCount = readModifier(0);
      if (modifierCount === 0) {
        return d.vec4f(x + velocityX * seconds, y + velocityY * seconds, velocityX, velocityY);
      }
      // Only radial modifiers need a heading for particles exactly at their center.
      const containsRadial = readModifier(1);
      let heading = d.vec2f(0, -1);
      if (containsRadial > 0) {
        let angularRotation = d.f32(0);
        if (orientToAngularVelocity > 0.5) {
          const rotationAfterStep = advanceRotation(
            accumulatedRotation,
            initialAngularVelocity,
            ageAfterStep,
            lifetime,
            angularVelocityCurve,
            seconds,
          );
          angularRotation = rotationAfterStep * handedness;
        }
        // Use this step's rotation but the velocity before modifiers change it.
        const baseRotation = initialRotation + angularRotation;
        heading = particleHeading(
          baseRotation,
          ageAfterStep,
          lifetime,
          rotationCurve,
          velocityX,
          velocityY,
          orientToMovement,
          handedness,
        );
      }
      const nextVelocity = applyModifiers(
        x,
        y,
        velocityX,
        velocityY,
        heading[0],
        heading[1],
        spreadFactor,
        seconds,
      );
      const nextX = x + nextVelocity[0] * seconds;
      const nextY = y + nextVelocity[1] * seconds;
      return d.vec4f(nextX, nextY, nextVelocity[0], nextVelocity[1]);
    },
  )
  .$name('integrateMotion');
