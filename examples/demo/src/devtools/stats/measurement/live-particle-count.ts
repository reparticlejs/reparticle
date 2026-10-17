import { propertyVariation } from '@reparticle/core';

import type { ParticleBatch } from '../../types/particle-batch';

/** Tracks live spawn batches, never individual particle positions or GPU textures. */
export class LiveParticleCount {
  private readonly batches: ParticleBatch[] = [];
  private emitted = 0;
  private carry = 0;
  private alive = 0;

  constructor(private readonly capacity: number) {}

  get count(): number {
    return this.alive;
  }

  /** Mirrors the demo emitter's spawn schedule without changing core instrumentation. */
  advance(seconds: number, rate: number, lifetime: number, spread = 0, seed = 1): number {
    const total = this.carry + rate * seconds;
    const requested = Math.floor(total + 1e-9);
    const spawned = Math.min(requested, this.capacity);
    this.carry = Math.max(0, total - requested);
    this.recordStep(seconds, spawned, lifetime, spread, seed);
    return spawned;
  }

  recordStep(seconds: number, spawned: number, lifetime: number, spread = 0, seed = 1): void {
    const end = this.emitted + spawned;
    const oldestSlot = end - this.capacity;
    const step = Math.fround(seconds);
    let retained = 0;
    let alive = 0;

    for (const batch of this.batches) {
      // Match the float32 age accumulation used by the simulation texture.
      batch.age = Math.fround(batch.age + step);
      batch.start = Math.max(batch.start, oldestSlot);
      const expired = batch.age >= batch.lifetime;
      const overwritten = batch.start >= batch.end;
      if (expired || overwritten) {
        continue;
      }
      this.batches[retained] = batch;
      retained += 1;
      if (batch.lifetimes) {
        for (let slot = batch.start; slot < batch.end; slot++) {
          if (batch.age < batch.lifetimes[slot - batch.origin!]!) {
            alive += 1;
          }
        }
      } else {
        alive += batch.end - batch.start;
      }
    }
    this.batches.length = retained;

    const particleLifetime = Math.fround(lifetime);
    if (spawned > 0 && particleLifetime + spread > 0) {
      const newborns: ParticleBatch = {
        start: this.emitted,
        end,
        age: 0,
        lifetime: particleLifetime,
      };
      if (spread > 0) {
        newborns.origin = this.emitted;
        newborns.lifetimes = new Float32Array(spawned);
        newborns.lifetime = 0;
        for (let index = 0; index < spawned; index++) {
          const slot = (this.emitted + index) % this.capacity;
          // Match the GPU's float32 division, subtraction, multiply and addition.
          const random = Math.fround(Math.fround(propertyVariation(slot, seed, 2) + 1) - 1);
          const sampled = Math.fround(particleLifetime + Math.fround(random * Math.fround(spread)));
          newborns.lifetimes[index] = sampled;
          newborns.lifetime = Math.max(newborns.lifetime, sampled);
          if (sampled > 0) {
            alive += 1;
          }
        }
      } else {
        alive += spawned;
      }
      this.batches.push(newborns);
    }
    this.emitted = end;
    this.alive = alive;
  }

  reset(): void {
    this.batches.length = 0;
    this.emitted = 0;
    this.carry = 0;
    this.alive = 0;
  }
}
