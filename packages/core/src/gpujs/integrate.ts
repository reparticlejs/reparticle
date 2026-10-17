import type { KernelContext, ParticleTexel, ParticleTexture } from '#types/layout.js';

import { applyGravity } from '../behaviors/gravity';
import { advanceAge, particleAlive } from '../behaviors/lifetime';
import { advancePosition, advanceVelocity } from '../behaviors/motion';
import { propertyVariation } from '../behaviors/property-variation';
import { spawnBox } from './spawn-box';
import { spawnCircle } from './spawn-circle';
import { spawnCone2D } from './spawn-cone2d';
import { spawnMotion } from './spawn-motion';
import { spawnRotation } from './spawn-rotation';

/**
 * GPU storage adapter: map this output texel to a particle, then apply its behavior.
 * All three bands read the previous texture so position and lifetime agree on spawning.
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
  gravity: number,
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
): ParticleTexel {
  const particleRow = this.thread.y % this.constants.rows;
  const particleId = particleRow * this.constants.width + this.thread.x;
  const spawnOffset = (particleId - spawnStart + this.constants.capacity) % this.constants.capacity;
  const properties = state[particleRow + this.constants.rows]![this.thread.x]!;
  const isSpawning = particleId < this.constants.capacity && spawnOffset < spawnCount;

  // Color texel: initialRed, initialGreen, initialBlue, initialAlpha.
  if (this.thread.y >= this.constants.rows * 2) {
    if (isSpawning) {
      return [initialRed, initialGreen, initialBlue, initialAlpha];
    }
    return state[particleRow + this.constants.rows * 2]![this.thread.x]!;
  }

  if (isSpawning) {
    // Unit-speed motion preserves the shape direction even when actual speed is zero.
    let spawned = spawnMotion(particleId, seed, emitterX, emitterY, 1, direction, spread);
    if (shapeType === 1) {
      spawned = spawnCircle(particleId, seed, emitterX, emitterY, 1, sizeX);
    } else if (shapeType === 2) {
      spawned = spawnBox(particleId, seed, emitterX, emitterY, 1, sizeX, sizeY);
    } else if (shapeType === 3) {
      spawned = spawnCone2D(particleId, seed, emitterX, emitterY, 1, sizeX, sizeY);
    }
    if (this.thread.y >= this.constants.rows) {
      let rotation = initialRotation + propertyVariation(particleId, seed, 4) * rotationSpread;
      if (orientToDirection > 0.5) {
        rotation += spawnRotation(spawned[2], spawned[3]);
      }
      const sampledLifetime = lifetime + propertyVariation(particleId, seed, 2) * lifetimeSpread;
      const sampledSize = initialSize + propertyVariation(particleId, seed, 3) * sizeSpread;
      return [0, sampledLifetime, sampledSize, rotation];
    }
    const sampledSpeed = speed + propertyVariation(particleId, seed, 1) * speedSpread;
    return [spawned[0], spawned[1], spawned[2] * sampledSpeed, spawned[3] * sampledSpeed];
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

  // Accumulate modifiers first, then integrate each axis exactly once.
  const accelerationX = applyGravity(0, 0);
  const accelerationY = applyGravity(0, gravity);
  return [
    advancePosition(x, velocityX, accelerationX, seconds),
    advancePosition(y, velocityY, accelerationY, seconds),
    advanceVelocity(velocityX, accelerationX, seconds),
    advanceVelocity(velocityY, accelerationY, seconds),
  ];
}
