import { tgpu, d } from 'typegpu';

import { PARTICLE_BAND } from '#simulation/data-layout.ts';
import { advanceRotation } from '#simulation/particles/angular-velocity.ts';
import { integrateMotion } from '#simulation/particles/integrate-motion.ts';
import { advanceAge, particleAlive } from '#simulation/particles/lifetime.ts';
import { movementRotation } from '#simulation/particles/movement-rotation.ts';
import { readState } from '#simulation/resources.ts';
import { ParticleAddress, ParticleMotion, ParticleStep } from '#types/shader-inputs.ts';

/**
 * Advance one logical band of an existing particle.
 * Every read comes from the previous state; no band depends on another band's
 * write in this step. A particle survives while its advanced age <= lifetime.
 * Expiration stops motion without replacing its position or birth properties.
 */
export const advanceParticle = tgpu
  .fn(
    [d.texture2d(d.f32), d.texture2d(d.f32), d.f32, ParticleAddress, ParticleStep],
    d.vec4f,
  )((state, birthState, birthPass, address, step) => {
    'use gpu';
    const properties = readState(
      state,
      birthState,
      birthPass,
      address.rows,
      address.column,
      address.row + address.rows * PARTICLE_BAND.properties,
    );
    const dynamics = readState(
      state,
      birthState,
      birthPass,
      address.rows,
      address.column,
      address.row + address.rows * PARTICLE_BAND.dynamics,
    );
    const age = properties.x;
    const lifetime = properties.y;
    const initialSize = properties.z;
    const initialRotation = properties.w;
    const wasActive = dynamics.x;
    const modifierVariation = dynamics.y;
    const angularVelocity = dynamics.z;
    const accumulatedRotation = dynamics.w;
    const active = wasActive * particleAlive(advanceAge(age, step.seconds), lifetime);

    // Preserve birth geometry; capture movement heading before this step's forces.
    if (address.band === PARTICLE_BAND.geometry) {
      const geometry = readState(
        state,
        birthState,
        birthPass,
        address.rows,
        address.column,
        address.row + address.rows * PARTICLE_BAND.geometry,
      );
      if (step.orientToMovement > 0.5 && active > 0.5) {
        const previousMotion = readState(
          state,
          birthState,
          birthPass,
          address.rows,
          address.column,
          address.row,
        );
        return d.vec4f(
          geometry.x,
          geometry.y,
          geometry.z,
          movementRotation(previousMotion.z, previousMotion.w),
        );
      }
      return d.vec4f(geometry);
    }
    // Expired particles retain rotation and variation, but become inactive.
    if (address.band === PARTICLE_BAND.dynamics) {
      if (step.orientToAngularVelocity > 0.5 && active > 0.5) {
        return d.vec4f(
          active,
          modifierVariation,
          angularVelocity,
          advanceRotation(
            accumulatedRotation,
            angularVelocity,
            age + step.seconds,
            lifetime,
            step.angularVelocityCurve,
            step.seconds,
          ),
        );
      }
      return d.vec4f(active, modifierVariation, angularVelocity, accumulatedRotation);
    }
    // Existing color is immutable in the simulation.
    if (address.band === PARTICLE_BAND.color) {
      return d.vec4f(
        readState(
          state,
          birthState,
          birthPass,
          address.rows,
          address.column,
          address.row + address.rows * PARTICLE_BAND.color,
        ),
      );
    }
    // Properties texel: age, lifetime, initialSize, resolved initialRotation (degrees).
    if (address.band === PARTICLE_BAND.properties) {
      return d.vec4f(advanceAge(age, step.seconds), lifetime, initialSize, initialRotation);
    }
    // Existing motion: expired particles keep their position but lose velocity.
    const motion = readState(
      state,
      birthState,
      birthPass,
      address.rows,
      address.column,
      address.row,
    );
    if (active < 0.5) {
      return d.vec4f(motion.x, motion.y, 0, 0);
    }
    const geometry = readState(
      state,
      birthState,
      birthPass,
      address.rows,
      address.column,
      address.row + address.rows * PARTICLE_BAND.geometry,
    );
    const particle = ParticleMotion({
      position: d.vec2f(motion.x, motion.y),
      velocity: d.vec2f(motion.z, motion.w),
      ageAfterStep: age + step.seconds,
      lifetime,
      initialRotation,
      accumulatedRotation,
      initialAngularVelocity: angularVelocity,
      modifierVariation,
      handedness: geometry.z,
    });
    return d.vec4f(integrateMotion(particle, step));
  })
  .$name('advanceParticle');
