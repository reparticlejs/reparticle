import type { KernelContext, ParticleTexel, ParticleTexture } from '#types/layout.js';

import { advanceRotation } from '../behaviors/angular-velocity';
import { advanceAge, particleAlive } from '../behaviors/lifetime';
import { applyModifiers } from '../behaviors/modifiers';
import { propertyVariation } from '../behaviors/property-variation';
import { particleHeading } from './particle-heading';
import { spawnBox } from './spawn-box';
import { spawnCircle } from './spawn-circle';
import { spawnCone2D } from './spawn-cone2d';
import { spawnMotion } from './spawn-motion';
import { spawnRotation } from './spawn-rotation';

/**
 * GPU storage adapter: map this output texel to a particle, then apply its behavior.
 * All five bands read the previous texture so position and lifetime agree on spawning.
 * The texture dimensions guarantee these indices; non-null assertions express that contract.
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
  sizeX: number,
  sizeY: number,
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
  emitterSizeSpreadX: number,
  emitterSizeSpreadY: number,
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
  const particleRow = this.thread.y % this.constants.rows;
  const particleId = particleRow * this.constants.width + this.thread.x;
  const properties = state[particleRow + this.constants.rows]![this.thread.x]!;
  const spawnWord = spawnMask[Math.floor(particleId / 24)]!;
  const spawnBit = Math.floor(spawnWord / Math.pow(2, particleId % 24)) % 2;
  const isSpawning = particleId < this.constants.capacity && spawnCount > 0 && spawnBit > 0.5;

  // A zero-time update must not prune a newborn retained from the previous frame.
  if (seconds === 0 && !isSpawning) {
    return state[this.thread.y]![this.thread.x]!;
  }
  const dynamics = state[particleRow + this.constants.rows * 3]![this.thread.x]!;
  const active = dynamics[0] * particleAlive(advanceAge(properties[0], seconds), properties[1]);

  if (this.thread.y >= this.constants.rows * 4) {
    if (isSpawning) {
      return [
        initialStretchX + propertyVariation(particleId, seed, 16) * stretchXSpread,
        initialStretchY + propertyVariation(particleId, seed, 17) * stretchYSpread,
        handedness,
        0,
      ];
    }
    return state[particleRow + this.constants.rows * 4]![this.thread.x]!;
  }

  if (this.thread.y >= this.constants.rows * 3) {
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

  // Color texel: initialRed, initialGreen, initialBlue, initialAlpha.
  if (this.thread.y >= this.constants.rows * 2) {
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

  if (isSpawning) {
    const sampledLifetime = lifetime + propertyVariation(particleId, seed, 2) * lifetimeSpread;
    const sampledX = sizeX + propertyVariation(particleId, seed, 12) * emitterSizeSpreadX;
    const sampledY = sizeY + propertyVariation(particleId, seed, 13) * emitterSizeSpreadY;
    // Unit-speed motion preserves the shape direction even when actual speed is zero.
    let spawned = spawnMotion(particleId, seed, 0, 0, 1, direction, spread);
    if (shapeType === 1) {
      spawned = spawnCircle(particleId, seed, 0, 0, 1, sampledX);
    } else if (shapeType === 2) {
      spawned = spawnBox(particleId, seed, 0, 0, 1, sampledX, sampledY);
    } else if (shapeType === 3) {
      spawned = spawnCone2D(particleId, seed, 0, 0, 1, sampledX, sampledY);
    }
    let rotation =
      initialRotation + propertyVariation(particleId, seed, 4) * rotationSpread * handedness;
    if (orientToDirection > 0.5) {
      rotation += spawnRotation(spawned[2], spawned[3]) * handedness;
    }
    if (this.thread.y >= this.constants.rows) {
      const sampledSize = initialSize + propertyVariation(particleId, seed, 3) * sizeSpread;
      return [seconds, sampledLifetime, sampledSize * emitterScale, rotation];
    }
    const sampledSpeed =
      (speed + propertyVariation(particleId, seed, 1) * speedSpread) * emitterScale;
    const birthFactor = propertyVariation(particleId, seed, 14);
    const birthX =
      (emitterCosine * spawned[2] * handedness - emitterSine * spawned[3]) * sampledSpeed +
      inheritedVelocityX;
    const birthY =
      (emitterSine * spawned[2] * handedness + emitterCosine * spawned[3]) * sampledSpeed +
      inheritedVelocityY;
    const positionX =
      emitterX +
      (emitterCosine * spawned[0] * handedness - emitterSine * spawned[1]) * emitterScale;
    const positionY =
      emitterY +
      (emitterSine * spawned[0] * handedness + emitterCosine * spawned[1]) * emitterScale;
    let velocity: [number, number] = [birthX, birthY];
    if (modifiers[0]! > 0) {
      let heading: [number, number] = [0, -1];
      if (modifiers[1]! > 0) {
        heading = particleHeading(
          rotation +
            (orientToAngularVelocity > 0.5
              ? advanceRotation(
                  0,
                  initialAngularVelocity +
                    propertyVariation(particleId, seed, 15) * angularVelocitySpread,
                  seconds,
                  sampledLifetime,
                  angularVelocityCurve,
                  seconds,
                ) * handedness
              : 0),
          seconds,
          sampledLifetime,
          rotationCurve,
          birthX,
          birthY,
          orientToMovement,
          handedness,
        );
      }
      velocity = applyModifiers(
        positionX,
        positionY,
        birthX,
        birthY,
        heading[0],
        heading[1],
        birthFactor,
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
    if (modifiers[1]! > 0) {
      const geometry = state[particleRow + this.constants.rows * 4]![this.thread.x]!;
      heading = particleHeading(
        properties[3] +
          (orientToAngularVelocity > 0.5
            ? advanceRotation(
                dynamics[3],
                dynamics[2],
                age + seconds,
                particleLifetime,
                angularVelocityCurve,
                seconds,
              ) * geometry[2]
            : 0),
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
