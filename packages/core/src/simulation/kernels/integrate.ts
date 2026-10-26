import { tgpu, d } from 'typegpu';

import { spawnRotation } from '#simulation/emission/rotation.ts';
import { sampleShape } from '#simulation/emission/shape.ts';
import { propertyVariation } from '#simulation/emission/variation.ts';
import { advanceRotation } from '#simulation/particles/angular-velocity.ts';
import { integrateMotion } from '#simulation/particles/integrate-motion.ts';
import { advanceAge } from '#simulation/particles/lifetime.ts';
import { particleAlive } from '#simulation/particles/lifetime.ts';
import { movementRotation } from '#simulation/particles/movement-rotation.ts';
import { readSpawn, readState } from '#simulation/resources.ts';

/**
 * Write one RGBA texel of the next particle-state texture.
 * A particle occupies the same column and row in five stacked bands:
 *   motion     [x, y, velocityX, velocityY]
 *   properties [age, lifetime, initialSize, initialRotation]
 *   color      [initialRed, initialGreen, initialBlue, initialAlpha]
 *   dynamics   [active, spreadFactor, initialAngularVelocity, accumulatedRotation]
 *   geometry   [initialStretchX, initialStretchY, initialHandedness, movementRotation]
 *
 * Every band reads the previous state. The CPU spawn mask decides births; newborns
 * receive a full step of age and motion, even when their lifetime is nonpositive.
 * Existing particles survive while their advanced age is <= their lifetime.
 *
 * TypeGPU compiles this function to GLSL at build time. The WebGL wrapper maps
 * these five logical bands into two changing-state bands and three birth bands.
 * Curve parameters are selectors; curve and modifier data stays in the input block.
 * Texture dimensions guarantee indexed reads; non-null assertions express that contract.
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
      const seed = stepInput[2];
      const lifetime = emissionInput[3];
      const lifetimeSpread = motionSpreadInput[1];
      const angularVelocitySpread = geometrySpreadInput[0];
      const orientToMovement = orientationInput[1];
      const orientToAngularVelocity = orientationInput[2];
      const initialAngularVelocity = orientationInput[3];
      // Map this band's texel back to its fixed particle slot.
      const band = Math.floor(threadY / rows);
      const propertiesBand = 1;
      const colorBand = 2;
      const dynamicsBand = 3;
      const geometryBand = 4;
      const particleRow = threadY % rows;
      const particleId = particleRow * width + threadX;
      const properties = readState(state, birthState, birthPass, rows, threadX, particleRow + rows);
      // One float32 mask word packs 24 exact birth bits.
      const spawnWord = readSpawn(spawnMask, Math.floor(particleId / 24));
      const spawnBit = Math.floor(spawnWord / Math.pow(2, particleId % 24)) % 2;
      const isSpawning = particleId < capacity && spawnCount > 0 && spawnBit > 0.5;
      // A zero-time update must not prune a newborn retained from the previous frame.
      if (seconds === 0 && !isSpawning) {
        return d.vec4f(readState(state, birthState, birthPass, rows, threadX, threadY));
      }
      const dynamics = readState(
        state,
        birthState,
        birthPass,
        rows,
        threadX,
        particleRow + rows * 3,
      );
      const active = dynamics[0] * particleAlive(advanceAge(properties[0], seconds), properties[1]);
      // Existing geometry: preserve birth values; capture movement heading before forces.
      if (band === geometryBand && !isSpawning) {
        const geometry = readState(
          state,
          birthState,
          birthPass,
          rows,
          threadX,
          particleRow + rows * 4,
        );
        if (orientToMovement > 0.5 && active > 0.5) {
          const previousMotion = readState(
            state,
            birthState,
            birthPass,
            rows,
            threadX,
            particleRow,
          );
          return d.vec4f(
            geometry[0],
            geometry[1],
            geometry[2],
            movementRotation(previousMotion[2], previousMotion[3]),
          );
        }
        return d.vec4f(geometry);
      }
      // Dynamics: active flag, stable modifier variation, and accumulated angular rotation.
      if (band === dynamicsBand) {
        if (isSpawning) {
          const angularVelocity =
            initialAngularVelocity +
            propertyVariation(particleId, seed, 15) * angularVelocitySpread;
          let rotation = d.f32(0);
          if (orientToAngularVelocity > 0.5) {
            const sampledLifetime =
              lifetime + propertyVariation(particleId, seed, 2) * lifetimeSpread;
            rotation = advanceRotation(
              0,
              angularVelocity,
              seconds,
              sampledLifetime,
              angularVelocityCurve,
              seconds,
            );
          }
          return d.vec4f(1, propertyVariation(particleId, seed, 14), angularVelocity, rotation);
        }
        if (orientToAngularVelocity > 0.5 && active > 0.5) {
          return d.vec4f(
            active,
            dynamics[1],
            dynamics[2],
            advanceRotation(
              dynamics[3],
              dynamics[2],
              properties[0] + seconds,
              properties[1],
              angularVelocityCurve,
              seconds,
            ),
          );
        }
        return d.vec4f(active, dynamics[1], dynamics[2], dynamics[3]);
      }
      // Color is captured at birth; rendering applies color/alpha curves later.
      if (band === colorBand) {
        if (isSpawning) {
          const initialRed = colorInput[0];
          const initialGreen = colorInput[1];
          const initialBlue = colorInput[2];
          const initialAlpha = colorInput[3];
          const redSpread = colorSpreadInput[0];
          const greenSpread = colorSpreadInput[1];
          const blueSpread = colorSpreadInput[2];
          const alphaSpread = colorSpreadInput[3];
          return d.vec4f(
            initialRed + propertyVariation(particleId, seed, 5) * redSpread,
            initialGreen + propertyVariation(particleId, seed, 6) * greenSpread,
            initialBlue + propertyVariation(particleId, seed, 7) * blueSpread,
            initialAlpha + propertyVariation(particleId, seed, 8) * alphaSpread,
          );
        }
        return d.vec4f(
          readState(state, birthState, birthPass, rows, threadX, particleRow + rows * 2),
        );
      }
      // Remaining birth outputs are properties, geometry, and motion.
      if (isSpawning) {
        const speed = emissionInput[0];
        const direction = emissionInput[1];
        const spread = emissionInput[2];
        const shapeType = shapeInput[0];
        const dimensionX = shapeInput[1];
        const dimensionY = shapeInput[2];
        const dimensionSpreadX = shapeSpreadInput[0];
        const dimensionSpreadY = shapeSpreadInput[1];
        const initialRotation = appearanceInput[1];
        const speedSpread = motionSpreadInput[0];
        const rotationSpread = motionSpreadInput[3];
        const emitterX = positionInput[0];
        const emitterY = positionInput[1];
        const inheritedVelocityX = positionInput[2];
        const inheritedVelocityY = positionInput[3];
        const emitterCosine = transformInput[0];
        const emitterSine = transformInput[1];
        const emitterScale = transformInput[2];
        const handedness = transformInput[3];
        const orientToDirection = orientationInput[0];
        const sampledLifetime = lifetime + propertyVariation(particleId, seed, 2) * lifetimeSpread;
        // Unit-speed motion preserves shape direction even when actual speed is zero.
        const spawnMotionState = sampleShape(
          particleId,
          seed,
          shapeType,
          direction,
          spread,
          dimensionX,
          dimensionY,
          dimensionSpreadX,
          dimensionSpreadY,
        );
        let rotation =
          initialRotation + propertyVariation(particleId, seed, 4) * rotationSpread * handedness;
        if (orientToDirection > 0.5) {
          rotation += spawnRotation(spawnMotionState[2], spawnMotionState[3]) * handedness;
        }
        // Properties start at one full step of age; scale is captured at birth.
        if (band === propertiesBand) {
          const initialSize = appearanceInput[0];
          const sizeSpread = motionSpreadInput[2];
          const sampledSize = initialSize + propertyVariation(particleId, seed, 3) * sizeSpread;
          return d.vec4f(seconds, sampledLifetime, sampledSize * emitterScale, rotation);
        }
        // Transform unit direction into simulation velocity, then add inherited motion.
        const sampledSpeed =
          (speed + propertyVariation(particleId, seed, 1) * speedSpread) * emitterScale;
        const birthSpreadFactor = propertyVariation(particleId, seed, 14);
        const birthVelocityX =
          (emitterCosine * spawnMotionState[2] * handedness - emitterSine * spawnMotionState[3]) *
            sampledSpeed +
          inheritedVelocityX;
        const birthVelocityY =
          (emitterSine * spawnMotionState[2] * handedness + emitterCosine * spawnMotionState[3]) *
            sampledSpeed +
          inheritedVelocityY;
        // New geometry captures the unmodified birth-velocity heading.
        if (band === geometryBand) {
          let birthHeading = d.f32(0);
          if (orientToMovement > 0.5) {
            birthHeading = movementRotation(birthVelocityX, birthVelocityY);
          }
          const initialStretchX = appearanceInput[2];
          const initialStretchY = appearanceInput[3];
          const stretchXSpread = geometrySpreadInput[1];
          const stretchYSpread = geometrySpreadInput[2];
          return d.vec4f(
            initialStretchX + propertyVariation(particleId, seed, 16) * stretchXSpread,
            initialStretchY + propertyVariation(particleId, seed, 17) * stretchYSpread,
            handedness,
            birthHeading,
          );
        }
        // Apply forces to the birth velocity before advancing the newborn position.
        const positionX =
          emitterX +
          (emitterCosine * spawnMotionState[0] * handedness - emitterSine * spawnMotionState[1]) *
            emitterScale;
        const positionY =
          emitterY +
          (emitterSine * spawnMotionState[0] * handedness + emitterCosine * spawnMotionState[1]) *
            emitterScale;
        const angularVelocity =
          initialAngularVelocity + propertyVariation(particleId, seed, 15) * angularVelocitySpread;
        return d.vec4f(
          integrateMotion(
            positionX,
            positionY,
            birthVelocityX,
            birthVelocityY,
            seconds,
            sampledLifetime,
            rotation,
            0,
            angularVelocity,
            birthSpreadFactor,
            handedness,
            seconds,
            orientToMovement,
            orientToAngularVelocity,
            rotationCurve,
            angularVelocityCurve,
          ),
        );
      }
      // Properties texel: age, lifetime, initialSize, resolved initialRotation (degrees).
      if (band === propertiesBand) {
        return d.vec4f(
          advanceAge(properties[0], seconds),
          properties[1],
          properties[2],
          properties[3],
        );
      }
      // Existing motion: expired particles keep their position but lose velocity.
      const motion = readState(state, birthState, birthPass, rows, threadX, particleRow);
      if (active < 0.5) {
        return d.vec4f(motion[0], motion[1], 0, 0);
      }
      const geometry = readState(
        state,
        birthState,
        birthPass,
        rows,
        threadX,
        particleRow + rows * 4,
      );
      return d.vec4f(
        integrateMotion(
          motion[0],
          motion[1],
          motion[2],
          motion[3],
          properties[0] + seconds,
          properties[1],
          properties[3],
          dynamics[3],
          dynamics[2],
          dynamics[1],
          geometry[2],
          seconds,
          orientToMovement,
          orientToAngularVelocity,
          rotationCurve,
          angularVelocityCurve,
        ),
      );
    },
  )
  .$name('integrate');
