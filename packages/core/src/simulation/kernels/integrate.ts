import type { KernelContext, ParticleTexel, ParticleTexture } from '#types/layout.js';
import type { UniformVector } from '#types/simulation.js';

import { spawnRotation } from '../emission/rotation';
import { sampleShape } from '../emission/shape';
import { propertyVariation } from '../emission/variation';
import { advanceRotation } from '../particles/angular-velocity';
import { integrateMotion } from '../particles/integrate-motion';
import { advanceAge, particleAlive } from '../particles/lifetime';
import { movementRotation } from '../particles/movement-rotation';

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
 * This function is compiled by GPU.js. Keep its operations within the supported
 * numeric subset. Vector inputs are packed by SimulationInputs; all other
 * inputs keep their existing texture-backed storage.
 * Texture dimensions guarantee indexed reads; non-null assertions express that contract.
 */
export function integrate(
  this: KernelContext,
  state: ParticleTexture,
  stepInput: UniformVector,
  emissionInput: UniformVector,
  shapeInput: UniformVector,
  shapeSpreadInput: UniformVector,
  appearanceInput: UniformVector,
  colorInput: UniformVector,
  motionSpreadInput: UniformVector,
  colorSpreadInput: UniformVector,
  geometrySpreadInput: UniformVector,
  positionInput: UniformVector,
  transformInput: UniformVector,
  orientationInput: UniformVector,
  spawnMask: Float32Array,
  rotationCurve: Float32Array,
  angularVelocityCurve: Float32Array,
  modifiers: Float32Array,
  pathInput: UniformVector,
): ParticleTexel {
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
  const band = Math.floor(this.thread.y / this.constants.rows);
  const propertiesBand = 1;
  const colorBand = 2;
  const dynamicsBand = 3;
  const geometryBand = 4;

  const particleRow = this.thread.y % this.constants.rows;
  const particleId = particleRow * this.constants.width + this.thread.x;
  const properties = state[particleRow + this.constants.rows]![this.thread.x]!;

  // One float32 mask word packs 24 exact birth bits.
  const spawnWord = spawnMask[Math.floor(particleId / 24)]!;
  const spawnBit = Math.floor(spawnWord / Math.pow(2, particleId % 24)) % 2;
  const isSpawning = particleId < this.constants.capacity && spawnCount > 0 && spawnBit > 0.5;

  // A zero-time update must not prune a newborn retained from the previous frame.
  if (seconds === 0 && !isSpawning) {
    return state[this.thread.y]![this.thread.x]!;
  }

  const dynamics = state[particleRow + this.constants.rows * 3]![this.thread.x]!;
  const active = dynamics[0] * particleAlive(advanceAge(properties[0], seconds), properties[1]);

  // Existing geometry: preserve birth values; capture movement heading before forces.
  if (band === geometryBand && !isSpawning) {
    const geometry = state[particleRow + this.constants.rows * 4]![this.thread.x]!;
    if (orientToMovement > 0.5 && active > 0.5) {
      const previousMotion = state[particleRow]![this.thread.x]!;
      return [
        geometry[0],
        geometry[1],
        geometry[2],
        movementRotation(previousMotion[2], previousMotion[3]),
      ];
    }
    return geometry;
  }

  // Dynamics: active flag, stable modifier variation, and accumulated angular rotation.
  if (band === dynamicsBand) {
    if (isSpawning) {
      const angularVelocity =
        initialAngularVelocity + propertyVariation(particleId, seed, 15) * angularVelocitySpread;
      let rotation = 0;
      if (orientToAngularVelocity > 0.5) {
        const sampledLifetime = lifetime + propertyVariation(particleId, seed, 2) * lifetimeSpread;
        rotation = advanceRotation(
          0,
          angularVelocity,
          seconds,
          sampledLifetime,
          angularVelocityCurve,
          seconds,
        );
      }
      return [1, propertyVariation(particleId, seed, 14), angularVelocity, rotation];
    }
    if (orientToAngularVelocity > 0.5 && active > 0.5) {
      return [
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
      ];
    }
    return [active, dynamics[1], dynamics[2], dynamics[3]];
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

      return [
        initialRed + propertyVariation(particleId, seed, 5) * redSpread,
        initialGreen + propertyVariation(particleId, seed, 6) * greenSpread,
        initialBlue + propertyVariation(particleId, seed, 7) * blueSpread,
        initialAlpha + propertyVariation(particleId, seed, 8) * alphaSpread,
      ];
    }
    return state[particleRow + this.constants.rows * 2]![this.thread.x]!;
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
      return [seconds, sampledLifetime, sampledSize * emitterScale, rotation];
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
      const initialStretchX = appearanceInput[2];
      const initialStretchY = appearanceInput[3];
      const stretchXSpread = geometrySpreadInput[1];
      const stretchYSpread = geometrySpreadInput[2];

      return [
        initialStretchX + propertyVariation(particleId, seed, 16) * stretchXSpread,
        initialStretchY + propertyVariation(particleId, seed, 17) * stretchYSpread,
        handedness,
        orientToMovement > 0.5 ? movementRotation(birthVelocityX, birthVelocityY) : 0,
      ];
    }

    // Distance births occupy the first ordinals in ascending slot order.
    // Prefixes skip whole mask words; at most 23 bits remain to count locally.
    let pathFraction = 1;
    if (stepInput[3] > 0) {
      const wordIndex = Math.floor(particleId / 24);
      const maskWords = Math.ceil(this.constants.capacity / 24);
      let ordinal = spawnMask[maskWords + wordIndex]!;
      for (let bit = 0; bit < 24; bit++) {
        if (bit < particleId % 24) {
          ordinal += Math.floor(spawnWord / Math.pow(2, bit)) % 2;
        }
      }
      if (ordinal < stepInput[3]) {
        pathFraction = Math.min(1, pathInput[2] + ordinal * pathInput[3]);
      }
    }

    // Apply forces to the birth velocity before advancing the newborn position.
    const positionX =
      emitterX +
      pathInput[0] * (pathFraction - 1) +
      (emitterCosine * spawnMotionState[0] * handedness - emitterSine * spawnMotionState[1]) *
        emitterScale;
    const positionY =
      emitterY +
      pathInput[1] * (pathFraction - 1) +
      (emitterSine * spawnMotionState[0] * handedness + emitterCosine * spawnMotionState[1]) *
        emitterScale;
    const angularVelocity =
      initialAngularVelocity + propertyVariation(particleId, seed, 15) * angularVelocitySpread;
    return integrateMotion(
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
      modifiers,
    );
  }

  // Properties texel: age, lifetime, initialSize, resolved initialRotation (degrees).
  if (band === propertiesBand) {
    return [advanceAge(properties[0], seconds), properties[1], properties[2], properties[3]];
  }

  // Existing motion: expired particles keep their position but lose velocity.
  const motion = state[particleRow]![this.thread.x]!;
  if (active < 0.5) {
    return [motion[0], motion[1], 0, 0];
  }

  const geometry = state[particleRow + this.constants.rows * 4]![this.thread.x]!;
  return integrateMotion(
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
    modifiers,
  );
}
