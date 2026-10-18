import type { KernelContext, ParticleTexel, ParticleTexture } from '#types/layout.js';

import { applyAcceleration } from '../behaviors/acceleration';
import { advanceRotation } from '../behaviors/angular-velocity';
import { applyDrag } from '../behaviors/drag';
import { advanceAge, particleAlive } from '../behaviors/lifetime';
import { advancePosition, advanceVelocity } from '../behaviors/motion';
import { propertyVariation } from '../behaviors/property-variation';
import { applyRadial } from '../behaviors/radial';
import { applySharedModifiers } from '../behaviors/shared-modifiers';
import { applyVortex } from '../behaviors/vortex';
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
  spawnStart: number,
  spawnCount: number,
  emitterX: number,
  emitterY: number,
  speed: number,
  direction: number,
  spread: number,
  accelerationMagnitude: number,
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
  dragMagnitude: number,
  dragSpread: number,
  dragDirectional: number,
  dragX: number,
  dragY: number,
  accelerationSpread: number,
  accelerationDirectionX: number,
  accelerationDirectionY: number,
  radialMagnitude: number,
  radialSpread: number,
  radialX: number,
  radialY: number,
  radialMaxDistance: number,
  rotationCurve: Float32Array,
  orientToMovement: number,
  vortexMagnitude: number,
  vortexSpread: number,
  vortexX: number,
  vortexY: number,
  vortexMaxDistance: number,
  vortexStartX: number,
  vortexStartY: number,
  initialAngularVelocity: number,
  angularVelocitySpread: number,
  angularVelocityCurve: Float32Array,
  orientToAngularVelocity: number,
  initialStretchX: number,
  initialStretchY: number,
  stretchXSpread: number,
  stretchYSpread: number,
  sharedModifiers: Float32Array,
): ParticleTexel {
  const particleRow = this.thread.y % this.constants.rows;
  const particleId = particleRow * this.constants.width + this.thread.x;
  const spawnOffset = (particleId - spawnStart + this.constants.capacity) % this.constants.capacity;
  const properties = state[particleRow + this.constants.rows]![this.thread.x]!;
  const isSpawning = particleId < this.constants.capacity && spawnOffset < spawnCount;

  if (this.thread.y >= this.constants.rows * 4) {
    if (isSpawning) {
      return [
        initialStretchX + propertyVariation(particleId, seed, 16) * stretchXSpread,
        initialStretchY + propertyVariation(particleId, seed, 17) * stretchYSpread,
        0,
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
        rotation = advanceRotation(0, angularVelocity, 0, lifetime, angularVelocityCurve, seconds);
      }
      return [propertyVariation(particleId, seed, 14), angularVelocity, rotation, 0];
    }
    const dynamics = state[particleRow + this.constants.rows * 3]![this.thread.x]!;
    if (orientToAngularVelocity > 0.5 && particleAlive(properties[0], properties[1]) > 0.5) {
      return [
        dynamics[0],
        dynamics[1],
        advanceRotation(
          dynamics[2],
          dynamics[1],
          properties[0] + seconds,
          properties[1],
          angularVelocityCurve,
          seconds,
        ),
        0,
      ];
    }
    return dynamics;
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
    let rotation = initialRotation + propertyVariation(particleId, seed, 4) * rotationSpread;
    if (orientToDirection > 0.5) {
      rotation += spawnRotation(spawned[2], spawned[3]);
    }
    if (this.thread.y >= this.constants.rows) {
      const sampledLifetime = lifetime + propertyVariation(particleId, seed, 2) * lifetimeSpread;
      const sampledSize = initialSize + propertyVariation(particleId, seed, 3) * sizeSpread;
      return [0, sampledLifetime, sampledSize * emitterScale, rotation];
    }
    const sampledSpeed =
      (speed + propertyVariation(particleId, seed, 1) * speedSpread) * emitterScale;
    const birthFactor = propertyVariation(particleId, seed, 14);
    const birthAccelerationX = applyAcceleration(
      accelerationDirectionX,
      accelerationMagnitude,
      accelerationSpread,
      birthFactor,
    );
    const birthAccelerationY = applyAcceleration(
      accelerationDirectionY,
      accelerationMagnitude,
      accelerationSpread,
      birthFactor,
    );
    const birthX =
      (emitterCosine * spawned[2] - emitterSine * spawned[3]) * sampledSpeed +
      inheritedVelocityX +
      birthAccelerationX * seconds;
    const birthY =
      (emitterSine * spawned[2] + emitterCosine * spawned[3]) * sampledSpeed +
      inheritedVelocityY +
      birthAccelerationY * seconds;
    const positionX =
      emitterX + (emitterCosine * spawned[0] - emitterSine * spawned[1]) * emitterScale;
    const positionY =
      emitterY + (emitterSine * spawned[0] + emitterCosine * spawned[1]) * emitterScale;
    let birthRadial = [0, 0];
    if (radialMagnitude !== 0 || radialSpread !== 0) {
      let heading: [number, number] = [0, -1];
      if (positionX === radialX && positionY === radialY) {
        heading = particleHeading(
          rotation +
            (orientToAngularVelocity > 0.5
              ? advanceRotation(
                  0,
                  initialAngularVelocity +
                    propertyVariation(particleId, seed, 15) * angularVelocitySpread,
                  0,
                  lifetime,
                  angularVelocityCurve,
                  seconds,
                )
              : 0),
          0,
          lifetime,
          rotationCurve,
          birthX - birthAccelerationX * seconds,
          birthY - birthAccelerationY * seconds,
          orientToMovement,
        );
      }
      birthRadial = applyRadial(
        positionX,
        positionY,
        radialX,
        radialY,
        heading[0],
        heading[1],
        radialMagnitude,
        radialSpread,
        birthFactor,
        radialMaxDistance,
      );
    }
    let birthVortex = [0, 0];
    if (vortexMagnitude !== 0 || vortexSpread !== 0) {
      birthVortex = applyVortex(
        positionX,
        positionY,
        vortexX,
        vortexY,
        vortexStartX,
        vortexStartY,
        vortexMagnitude,
        vortexSpread,
        birthFactor,
        vortexMaxDistance,
      );
    }
    const birthProjection = birthX * dragX + birthY * dragY;
    const result: ParticleTexel = [
      positionX,
      positionY,
      applyDrag(
        birthX,
        dragDirectional > 0.5 ? birthProjection * dragX : birthX,
        dragMagnitude,
        dragSpread,
        birthFactor,
        seconds,
      ) +
        (birthRadial[0]! + birthVortex[0]!) * seconds,
      applyDrag(
        birthY,
        dragDirectional > 0.5 ? birthProjection * dragY : birthY,
        dragMagnitude,
        dragSpread,
        birthFactor,
        seconds,
      ) +
        (birthRadial[1]! + birthVortex[1]!) * seconds,
    ];
    if (sharedModifiers[0]! > 0.5) {
      const heading = particleHeading(
        rotation +
          (orientToAngularVelocity > 0.5
            ? advanceRotation(
                0,
                initialAngularVelocity +
                  propertyVariation(particleId, seed, 15) * angularVelocitySpread,
                0,
                lifetime,
                angularVelocityCurve,
                seconds,
              )
            : 0),
        0,
        lifetime,
        rotationCurve,
        birthX - birthAccelerationX * seconds,
        birthY - birthAccelerationY * seconds,
        orientToMovement,
      );
      const velocity = applySharedModifiers(
        positionX,
        positionY,
        result[2],
        result[3],
        heading[0],
        heading[1],
        birthFactor,
        seconds,
        sharedModifiers,
      );
      return [positionX, positionY, velocity[0], velocity[1]];
    }
    return result;
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
  if (particleAlive(age, particleLifetime) < 0.5) {
    return [x, y, 0, 0];
  }

  // Acceleration precedes drag; both modifiers share the particle's birth spread factor.
  let modifierState = [0, 0, 0, 0];
  if (
    sharedModifiers[0]! > 0.5 ||
    dragSpread !== 0 ||
    accelerationSpread !== 0 ||
    radialSpread !== 0 ||
    vortexSpread !== 0 ||
    orientToAngularVelocity > 0.5
  ) {
    modifierState = state[particleRow + this.constants.rows * 3]![this.thread.x]!;
  }
  const factor = modifierState[0]!;
  const accelerationX = applyAcceleration(
    accelerationDirectionX,
    accelerationMagnitude,
    accelerationSpread,
    factor,
  );
  const accelerationY = applyAcceleration(
    accelerationDirectionY,
    accelerationMagnitude,
    accelerationSpread,
    factor,
  );
  let radial = [0, 0];
  if (radialMagnitude !== 0 || radialSpread !== 0) {
    let heading: [number, number] = [0, -1];
    if (x === radialX && y === radialY) {
      heading = particleHeading(
        properties[3] +
          (orientToAngularVelocity > 0.5
            ? advanceRotation(
                modifierState[2]!,
                modifierState[1]!,
                age + seconds,
                particleLifetime,
                angularVelocityCurve,
                seconds,
              )
            : 0),
        age + seconds,
        particleLifetime,
        rotationCurve,
        velocityX,
        velocityY,
        orientToMovement,
      );
    }
    radial = applyRadial(
      x,
      y,
      radialX,
      radialY,
      heading[0],
      heading[1],
      radialMagnitude,
      radialSpread,
      factor,
      radialMaxDistance,
    );
  }
  let vortex = [0, 0];
  if (vortexMagnitude !== 0 || vortexSpread !== 0) {
    vortex = applyVortex(
      x,
      y,
      vortexX,
      vortexY,
      vortexStartX,
      vortexStartY,
      vortexMagnitude,
      vortexSpread,
      factor,
      vortexMaxDistance,
    );
  }
  const acceleratedX = advanceVelocity(velocityX, accelerationX, seconds);
  const acceleratedY = advanceVelocity(velocityY, accelerationY, seconds);
  const projection = acceleratedX * dragX + acceleratedY * dragY;
  const dampedX = applyDrag(
    acceleratedX,
    dragDirectional > 0.5 ? projection * dragX : acceleratedX,
    dragMagnitude,
    dragSpread,
    factor,
    seconds,
  );
  const dampedY = applyDrag(
    acceleratedY,
    dragDirectional > 0.5 ? projection * dragY : acceleratedY,
    dragMagnitude,
    dragSpread,
    factor,
    seconds,
  );
  const result: ParticleTexel = [
    advancePosition(x, velocityX, accelerationX, seconds) +
      (dampedX - acceleratedX + (radial[0]! + vortex[0]!) * seconds) * seconds,
    advancePosition(y, velocityY, accelerationY, seconds) +
      (dampedY - acceleratedY + (radial[1]! + vortex[1]!) * seconds) * seconds,
    dampedX + (radial[0]! + vortex[0]!) * seconds,
    dampedY + (radial[1]! + vortex[1]!) * seconds,
  ];
  if (sharedModifiers[0]! > 0.5) {
    const heading = particleHeading(
      properties[3] +
        (orientToAngularVelocity > 0.5
          ? advanceRotation(
              modifierState[2]!,
              modifierState[1]!,
              age + seconds,
              particleLifetime,
              angularVelocityCurve,
              seconds,
            )
          : 0),
      age + seconds,
      particleLifetime,
      rotationCurve,
      velocityX,
      velocityY,
      orientToMovement,
    );
    const velocity = applySharedModifiers(
      x,
      y,
      result[2],
      result[3],
      heading[0],
      heading[1],
      factor,
      seconds,
      sharedModifiers,
    );
    return [
      result[0] + (velocity[0] - result[2]) * seconds,
      result[1] + (velocity[1] - result[3]) * seconds,
      velocity[0],
      velocity[1],
    ];
  }
  return result;
}
