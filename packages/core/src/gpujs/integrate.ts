import { applyGravity } from '../behaviors/gravity';
import { advanceAge, particleAlive } from '../behaviors/lifetime';
import { advancePosition, advanceVelocity } from '../behaviors/motion';
import type { KernelContext, ParticleTexel, ParticleTexture } from './layout';
import { spawnBox } from './spawn-box';
import { spawnCircle } from './spawn-circle';
import { spawnMotion } from './spawn-motion';

/**
 * GPU storage adapter: map this output texel to a particle, then apply its behavior.
 * Both halves read the previous texture so position and lifetime agree on spawning.
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
): ParticleTexel {
  const particleRow = this.thread.y % this.constants.rows;
  const particleId = particleRow * this.constants.width + this.thread.x;
  const spawnOffset = (particleId - spawnStart + this.constants.capacity) % this.constants.capacity;
  const lifetimeState = state[particleRow + this.constants.rows]![this.thread.x]!;
  const isSpawning = particleId < this.constants.capacity && spawnOffset < spawnCount;

  // Lifetime texel: age, lifetime, initialized, reserved.
  if (this.thread.y >= this.constants.rows) {
    if (isSpawning) {
      return [0, lifetime, 1, 0];
    }
    return [advanceAge(lifetimeState[0], seconds), lifetimeState[1], lifetimeState[2], 0];
  }

  // Motion texel for a newly emitted particle.
  if (isSpawning) {
    if (shapeType === 1) {
      return spawnCircle(particleId, seed, emitterX, emitterY, speed, sizeX);
    }
    if (shapeType === 2) {
      return spawnBox(particleId, seed, emitterX, emitterY, speed, sizeX, sizeY);
    }
    return spawnMotion(particleId, seed, emitterX, emitterY, speed, direction, spread);
  }

  const motion = state[particleRow]![this.thread.x]!;
  const x = motion[0];
  const y = motion[1];
  const velocityX = motion[2];
  const velocityY = motion[3];
  const age = lifetimeState[0];
  const particleLifetime = lifetimeState[1];
  const initialized = lifetimeState[2];
  if (particleAlive(initialized, age, particleLifetime) < 0.5) {
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
