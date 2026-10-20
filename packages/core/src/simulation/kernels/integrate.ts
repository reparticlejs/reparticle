import type { KernelContext, ParticleTexel, ParticleTexture } from '#types/layout.js';

import { spawnBox } from '../emission/box';
import { spawnCircle } from '../emission/circle';
import { spawnCone2D } from '../emission/cone2d';
import { spawnMotion } from '../emission/motion';
import { spawnRotation } from '../emission/rotation';
import { propertyVariation } from '../emission/variation';
import { applyModifiers } from '../modifiers/apply-modifiers';
import { advanceRotation } from '../particles/angular-velocity';
import { particleHeading } from '../particles/heading';
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
 * numeric subset and its positional arguments aligned with Emitter.integrate().
 * Texture dimensions guarantee indexed reads; non-null assertions express that contract.
 */
export function integrate(
  this: KernelContext,
  state: ParticleTexture,
  seconds: number,
  spawnMask: Float32Array,
  spawnCount: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  direction: number,
  spread: number,
  lifetime: number,
  seed: number,
  shapeType: number,
  dimensionX: number,
  dimensionY: number,
  initialSize: number,
  initialAlpha: number,
  initialRed: number,
  initialGreen: number,
  initialBlue: number,
  initialRotation: number,
  orientToDirection: number,
  speedSpread: number,
  lifetimeSpread: number,
  sizeSpread: number,
  rotationSpread: number,
  redSpread: number,
  greenSpread: number,
  blueSpread: number,
  alphaSpread: number,
  dimensionSpreadX: number,
  dimensionSpreadY: number,
  inheritedVelocityX: number,
  inheritedVelocityY: number,
  emitterCosine: number,
  emitterSine: number,
  emitterScale: number,
  rotationCurve: Float32Array,
  orientToMovement: number,
  initialAngularVelocity: number,
  angularVelocitySpread: number,
  angularVelocityCurve: Float32Array,
  orientToAngularVelocity: number,
  initialStretchX: number,
  initialStretchY: number,
  stretchXSpread: number,
  stretchYSpread: number,
  modifiers: Float32Array,
  handedness: number,
): ParticleTexel {
  // Map this band's texel back to its fixed particle slot.
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
  if (this.thread.y >= this.constants.rows * 4 && !isSpawning) {
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
  if (this.thread.y >= this.constants.rows * 3 && this.thread.y < this.constants.rows * 4) {
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
  if (this.thread.y >= this.constants.rows * 2 && this.thread.y < this.constants.rows * 3) {
    if (isSpawning) {
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
    const sampledLifetime = lifetime + propertyVariation(particleId, seed, 2) * lifetimeSpread;
    const sampledDimensionX =
      dimensionX + propertyVariation(particleId, seed, 12) * dimensionSpreadX;
    const sampledDimensionY =
      dimensionY + propertyVariation(particleId, seed, 13) * dimensionSpreadY;

    // Unit-speed motion preserves the shape direction even when actual speed is zero.
    let spawnMotionState = spawnMotion(particleId, seed, 0, 0, 1, direction, spread);
    if (shapeType === 1) {
      spawnMotionState = spawnCircle(particleId, seed, 0, 0, 1, sampledDimensionX);
    } else if (shapeType === 2) {
      spawnMotionState = spawnBox(particleId, seed, 0, 0, 1, sampledDimensionX, sampledDimensionY);
    } else if (shapeType === 3) {
      spawnMotionState = spawnCone2D(
        particleId,
        seed,
        0,
        0,
        1,
        sampledDimensionX,
        sampledDimensionY,
      );
    }

    let rotation =
      initialRotation + propertyVariation(particleId, seed, 4) * rotationSpread * handedness;
    if (orientToDirection > 0.5) {
      rotation += spawnRotation(spawnMotionState[2], spawnMotionState[3]) * handedness;
    }
    // Properties start at one full step of age; scale is captured at birth.
    if (this.thread.y >= this.constants.rows && this.thread.y < this.constants.rows * 2) {
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
    if (this.thread.y >= this.constants.rows * 4) {
      return [
        initialStretchX + propertyVariation(particleId, seed, 16) * stretchXSpread,
        initialStretchY + propertyVariation(particleId, seed, 17) * stretchYSpread,
        handedness,
        orientToMovement > 0.5 ? movementRotation(birthVelocityX, birthVelocityY) : 0,
      ];
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
    let velocity: [number, number] = [birthVelocityX, birthVelocityY];
    if (modifiers[0]! > 0) {
      let heading: [number, number] = [0, -1];
      // Only radial modifiers need the particle's orientation-based heading.
      if (modifiers[1]! > 0) {
        let accumulatedRotation = 0;
        if (orientToAngularVelocity > 0.5) {
          const angularVelocity =
            initialAngularVelocity +
            propertyVariation(particleId, seed, 15) * angularVelocitySpread;
          accumulatedRotation =
            advanceRotation(
              0,
              angularVelocity,
              seconds,
              sampledLifetime,
              angularVelocityCurve,
              seconds,
            ) * handedness;
        }
        heading = particleHeading(
          rotation + accumulatedRotation,
          seconds,
          sampledLifetime,
          rotationCurve,
          birthVelocityX,
          birthVelocityY,
          orientToMovement,
          handedness,
        );
      }
      velocity = applyModifiers(
        positionX,
        positionY,
        birthVelocityX,
        birthVelocityY,
        heading[0],
        heading[1],
        birthSpreadFactor,
        seconds,
        modifiers,
      );
    }
    return [
      positionX + velocity[0] * seconds,
      positionY + velocity[1] * seconds,
      velocity[0],
      velocity[1],
    ];
  }

  // Properties texel: age, lifetime, initialSize, resolved initialRotation (degrees).
  if (this.thread.y >= this.constants.rows) {
    return [advanceAge(properties[0], seconds), properties[1], properties[2], properties[3]];
  }

  // Existing motion: expired particles keep their position but lose velocity.
  const motion = state[particleRow]![this.thread.x]!;
  const x = motion[0];
  const y = motion[1];
  const velocityX = motion[2];
  const velocityY = motion[3];
  const age = properties[0];
  const particleLifetime = properties[1];
  if (active < 0.5) {
    return [x, y, 0, 0];
  }

  let velocity: [number, number] = [velocityX, velocityY];
  if (modifiers[0]! > 0) {
    let heading: [number, number] = [0, -1];
    // Only radial modifiers need the particle's orientation-based heading.
    if (modifiers[1]! > 0) {
      const geometry = state[particleRow + this.constants.rows * 4]![this.thread.x]!;
      let accumulatedRotation = 0;
      if (orientToAngularVelocity > 0.5) {
        accumulatedRotation =
          advanceRotation(
            dynamics[3],
            dynamics[2],
            age + seconds,
            particleLifetime,
            angularVelocityCurve,
            seconds,
          ) * geometry[2];
      }
      heading = particleHeading(
        properties[3] + accumulatedRotation,
        age + seconds,
        particleLifetime,
        rotationCurve,
        velocityX,
        velocityY,
        orientToMovement,
        geometry[2],
      );
    }
    velocity = applyModifiers(
      x,
      y,
      velocityX,
      velocityY,
      heading[0],
      heading[1],
      dynamics[1],
      seconds,
      modifiers,
    );
  }
  return [x + velocity[0] * seconds, y + velocity[1] * seconds, velocity[0], velocity[1]];
}
