import { tgpu, d } from 'typegpu';

import { PARTICLE_BAND } from '#simulation/data-layout.ts';
import { spawnRotation } from '#simulation/emission/rotation.ts';
import { sampleShape } from '#simulation/emission/shape.ts';
import { propertyVariation, VARIATION_STREAM } from '#simulation/emission/variation.ts';
import { advanceRotation } from '#simulation/particles/angular-velocity.ts';
import { integrateMotion } from '#simulation/particles/integrate-motion.ts';
import { movementRotation } from '#simulation/particles/movement-rotation.ts';
import { ParticleBirth, ParticleMotion, ParticleStep } from '#types/shader-inputs.ts';

/**
 * Initialize one logical band of a newborn particle.
 * Birth properties use deterministic variation based on the particle slot and seed.
 * Newborns receive a full step of motion, age, and angular rotation, even when
 * their lifetime is nonpositive. Movement heading is captured before forces.
 * The caller writes each band's result into the corresponding state texture.
 */
export const initializeParticle = tgpu
  .fn(
    [d.f32, d.f32, ParticleBirth, ParticleStep],
    d.vec4f,
  )((band, particleId, birth, step) => {
    'use gpu';

    // Birth dynamics start active and include the first step of angular rotation.
    if (band === PARTICLE_BAND.dynamics) {
      const angularVelocity =
        birth.initialAngularVelocity +
        propertyVariation(particleId, birth.seed, VARIATION_STREAM.angularVelocity) *
          birth.angularVelocitySpread;
      let rotation = d.f32(0);
      if (step.orientToAngularVelocity > 0.5) {
        const sampledLifetime =
          birth.lifetime +
          propertyVariation(particleId, birth.seed, VARIATION_STREAM.lifetime) *
            birth.lifetimeSpread;
        rotation = advanceRotation(
          0,
          angularVelocity,
          step.seconds,
          sampledLifetime,
          step.angularVelocityCurve,
          step.seconds,
        );
      }
      return d.vec4f(
        1,
        propertyVariation(particleId, birth.seed, VARIATION_STREAM.modifier),
        angularVelocity,
        rotation,
      );
    }
    // Capture initial color; lifetime color curves are applied by the renderer.
    if (band === PARTICLE_BAND.color) {
      return d.vec4f(
        birth.initialRed +
          propertyVariation(particleId, birth.seed, VARIATION_STREAM.red) * birth.redSpread,
        birth.initialGreen +
          propertyVariation(particleId, birth.seed, VARIATION_STREAM.green) * birth.greenSpread,
        birth.initialBlue +
          propertyVariation(particleId, birth.seed, VARIATION_STREAM.blue) * birth.blueSpread,
        birth.initialAlpha +
          propertyVariation(particleId, birth.seed, VARIATION_STREAM.alpha) * birth.alphaSpread,
      );
    }
    const sampledLifetime =
      birth.lifetime +
      propertyVariation(particleId, birth.seed, VARIATION_STREAM.lifetime) * birth.lifetimeSpread;
    // Unit-speed motion preserves shape direction even when actual speed is zero.
    const shape = sampleShape(
      particleId,
      birth.seed,
      birth.shapeType,
      birth.direction,
      birth.spread,
      birth.dimensionX,
      birth.dimensionY,
      birth.dimensionSpreadX,
      birth.dimensionSpreadY,
    );
    // Shape XY is local position; ZW is the unit direction.
    let rotation =
      birth.initialRotation +
      propertyVariation(particleId, birth.seed, VARIATION_STREAM.rotation) *
        birth.rotationSpread *
        birth.handedness;
    if (birth.orientToDirection > 0.5) {
      rotation += spawnRotation(shape.z, shape.w) * birth.handedness;
    }
    // Properties start at one full step of age; scale is captured at birth.
    if (band === PARTICLE_BAND.properties) {
      const sampledSize =
        birth.initialSize +
        propertyVariation(particleId, birth.seed, VARIATION_STREAM.size) * birth.sizeSpread;
      return d.vec4f(step.seconds, sampledLifetime, sampledSize * birth.emitterScale, rotation);
    }
    // Transform unit direction into simulation velocity, then add inherited motion.
    const sampledSpeed =
      (birth.speed +
        propertyVariation(particleId, birth.seed, VARIATION_STREAM.speed) * birth.speedSpread) *
      birth.emitterScale;
    const birthSpreadFactor = propertyVariation(particleId, birth.seed, VARIATION_STREAM.modifier);
    const birthVelocityX =
      (birth.emitterCosine * shape.z * birth.handedness - birth.emitterSine * shape.w) *
        sampledSpeed +
      birth.inheritedVelocityX;
    const birthVelocityY =
      (birth.emitterSine * shape.z * birth.handedness + birth.emitterCosine * shape.w) *
        sampledSpeed +
      birth.inheritedVelocityY;
    // New geometry captures the unmodified birth-velocity heading.
    if (band === PARTICLE_BAND.geometry) {
      let birthHeading = d.f32(0);
      if (step.orientToMovement > 0.5) {
        birthHeading = movementRotation(birthVelocityX, birthVelocityY);
      }
      return d.vec4f(
        birth.initialStretchX +
          propertyVariation(particleId, birth.seed, VARIATION_STREAM.stretchX) *
            birth.stretchXSpread,
        birth.initialStretchY +
          propertyVariation(particleId, birth.seed, VARIATION_STREAM.stretchY) *
            birth.stretchYSpread,
        birth.handedness,
        birthHeading,
      );
    }
    // Apply forces to the birth velocity before advancing the newborn position.
    const positionX =
      birth.emitterX +
      (birth.emitterCosine * shape.x * birth.handedness - birth.emitterSine * shape.y) *
        birth.emitterScale;
    const positionY =
      birth.emitterY +
      (birth.emitterSine * shape.x * birth.handedness + birth.emitterCosine * shape.y) *
        birth.emitterScale;
    const angularVelocity =
      birth.initialAngularVelocity +
      propertyVariation(particleId, birth.seed, VARIATION_STREAM.angularVelocity) *
        birth.angularVelocitySpread;
    const particle = ParticleMotion({
      position: d.vec2f(positionX, positionY),
      velocity: d.vec2f(birthVelocityX, birthVelocityY),
      ageAfterStep: step.seconds,
      lifetime: sampledLifetime,
      initialRotation: rotation,
      accumulatedRotation: 0,
      initialAngularVelocity: angularVelocity,
      modifierVariation: birthSpreadFactor,
      handedness: birth.handedness,
    });
    return d.vec4f(integrateMotion(particle, step));
  })
  .$name('initializeParticle');
