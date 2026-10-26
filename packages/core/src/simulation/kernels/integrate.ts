import { tgpu, d } from 'typegpu';

import { readSpawn, readState } from '#simulation/resources.ts';
import { ParticleAddress, ParticleBirth, ParticleStep } from '#types/shader-inputs.ts';

import { advanceParticle } from './advance-particle.ts';
import { initializeParticle } from './initialize-particle.ts';

/**
 * Select the newborn or existing-particle path for one logical state texel.
 *
 * Logical bands: motion [x, y, vx, vy], properties [age, lifetime, size, rotation],
 * color [r, g, b, a], dynamics [active, variation, angularVelocity, rotation],
 * geometry [stretchX, stretchY, handedness, movementHeading].
 *
 * The WebGL wrapper maps these five logical bands onto two changing-state bands
 * and three birth-data bands. Keep this entry signature aligned with the wrapper.
 * TypeGPU compiles this function and its helpers to GLSL during the package build.
 */
export const integrate = tgpu
  .fn(
    [
      d.texture2d(d.f32),
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.vec4f,
      d.texture2d(d.f32),
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.f32,
      d.texture2d(d.f32),
      d.f32,
    ],
    d.vec4f,
  )(
    (
      state,
      stepInput,
      emissionInput,
      shapeInput,
      shapeSpreadInput,
      appearanceInput,
      colorInput,
      motionSpreadInput,
      colorSpreadInput,
      geometrySpreadInput,
      positionInput,
      transformInput,
      orientationInput,
      spawnMask,
      rotationCurve,
      angularVelocityCurve,
      threadX,
      threadY,
      width,
      rows,
      capacity,
      birthState,
      birthPass,
    ) => {
      'use gpu';
      const seconds = stepInput[0];
      const spawnCount = stepInput[1];
      const band = Math.floor(threadY / rows);
      const particleRow = threadY % rows;
      const particleId = particleRow * width + threadX;

      // Each float32 mask word packs 24 exact birth bits.
      const spawnWord = readSpawn(spawnMask, Math.floor(particleId / 24));
      const spawnBit = Math.floor(spawnWord / Math.pow(2, particleId % 24)) % 2;
      const isSpawning = particleId < capacity && spawnCount > 0 && spawnBit > 0.5;
      // Decode packed inputs here so particle math can use named fields.
      const step = ParticleStep({
        seconds: stepInput[0],
        orientToMovement: orientationInput[1],
        orientToAngularVelocity: orientationInput[2],
        rotationCurve,
        angularVelocityCurve,
      });
      if (isSpawning) {
        const birth = ParticleBirth({
          seed: stepInput[2],
          speed: emissionInput[0],
          direction: emissionInput[1],
          spread: emissionInput[2],
          lifetime: emissionInput[3],
          shapeType: shapeInput[0],
          dimensionX: shapeInput[1],
          dimensionY: shapeInput[2],
          dimensionSpreadX: shapeSpreadInput[0],
          dimensionSpreadY: shapeSpreadInput[1],
          initialSize: appearanceInput[0],
          initialRotation: appearanceInput[1],
          initialStretchX: appearanceInput[2],
          initialStretchY: appearanceInput[3],
          initialRed: colorInput[0],
          initialGreen: colorInput[1],
          initialBlue: colorInput[2],
          initialAlpha: colorInput[3],
          speedSpread: motionSpreadInput[0],
          lifetimeSpread: motionSpreadInput[1],
          sizeSpread: motionSpreadInput[2],
          rotationSpread: motionSpreadInput[3],
          redSpread: colorSpreadInput[0],
          greenSpread: colorSpreadInput[1],
          blueSpread: colorSpreadInput[2],
          alphaSpread: colorSpreadInput[3],
          angularVelocitySpread: geometrySpreadInput[0],
          stretchXSpread: geometrySpreadInput[1],
          stretchYSpread: geometrySpreadInput[2],
          emitterX: positionInput[0],
          emitterY: positionInput[1],
          inheritedVelocityX: positionInput[2],
          inheritedVelocityY: positionInput[3],
          emitterCosine: transformInput[0],
          emitterSine: transformInput[1],
          emitterScale: transformInput[2],
          handedness: transformInput[3],
          orientToDirection: orientationInput[0],
          initialAngularVelocity: orientationInput[3],
        });
        return initializeParticle(band, particleId, birth, step);
      }

      // Zero-time updates preserve even newborns with nonpositive lifetimes.
      if (seconds === 0) {
        return d.vec4f(readState(state, birthState, birthPass, rows, threadX, threadY));
      }
      const address = ParticleAddress({ band, column: threadX, row: particleRow, rows });
      return advanceParticle(state, birthState, birthPass, address, step);
    },
  )
  .$name('integrate');
