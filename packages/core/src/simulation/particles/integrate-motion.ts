import { tgpu, d } from 'typegpu';

import { MODIFIER_COUNT_INDEX, MODIFIER_RADIAL_FLAG_INDEX } from '#simulation/layout.ts';
import { applyModifiers } from '#simulation/modifiers/list.ts';
import { readModifier } from '#simulation/resources.ts';
import { ParticleMotion, ParticleStep } from '#types/shader-inputs.ts';

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
    [ParticleMotion, ParticleStep],
    d.vec4f,
  )((particle, step) => {
    'use gpu';
    const modifierCount = readModifier(MODIFIER_COUNT_INDEX);
    if (modifierCount === 0) {
      return d.vec4f(
        particle.position.x + particle.velocity.x * step.seconds,
        particle.position.y + particle.velocity.y * step.seconds,
        particle.velocity.x,
        particle.velocity.y,
      );
    }
    // Only radial modifiers need a heading for particles exactly at their center.
    const containsRadial = readModifier(MODIFIER_RADIAL_FLAG_INDEX);
    let heading = d.vec2f(0, -1);
    if (containsRadial > 0) {
      let angularRotation = d.f32(0);
      if (step.orientToAngularVelocity > 0.5) {
        const rotationAfterStep = advanceRotation(
          particle.accumulatedRotation,
          particle.initialAngularVelocity,
          particle.ageAfterStep,
          particle.lifetime,
          step.angularVelocityCurve,
          step.seconds,
        );
        angularRotation = rotationAfterStep * particle.handedness;
      }
      // Use this step's rotation but the velocity before modifiers change it.
      const baseRotation = particle.initialRotation + angularRotation;
      heading = particleHeading(
        baseRotation,
        particle.ageAfterStep,
        particle.lifetime,
        step.rotationCurve,
        particle.velocity.x,
        particle.velocity.y,
        step.orientToMovement,
        particle.handedness,
      );
    }
    const nextVelocity = applyModifiers(
      particle.position.x,
      particle.position.y,
      particle.velocity.x,
      particle.velocity.y,
      heading.x,
      heading.y,
      particle.modifierVariation,
      step.seconds,
    );
    const nextX = particle.position.x + nextVelocity.x * step.seconds;
    const nextY = particle.position.y + nextVelocity.y * step.seconds;
    return d.vec4f(nextX, nextY, nextVelocity.x, nextVelocity.y);
  })
  .$name('integrateMotion');
