import type { ParticleLifetimeVisitor } from '#types/particle-lifetime.js';
import type { ParticleSlotBatch } from '#types/particle-slots.js';

import { propertyVariation } from './behaviors/property-variation';
import { ParticleOrder } from './particle-order';

/** CPU allocation metadata only; particle positions and velocities remain on the GPU. */
export class ParticleSlots {
  private version = 0;
  private readonly order: ParticleOrder | undefined;
  private maximumLifetime = NaN;
  readonly spawnMask: Float32Array;
  private readonly free: Uint32Array;
  private readonly lifetimes: Float32Array;
  private freeCount: number;
  private batches: ParticleSlotBatch[] = [];

  constructor(
    private readonly capacity: number,
    trackOrder = false,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1_000_000) {
      throw new RangeError('Capacity must be an integer from 1 to 1,000,000');
    }
    // 24 bits per float stay exact in GPU.js single precision.
    this.order = trackOrder ? new ParticleOrder(capacity) : undefined;
    this.spawnMask = new Float32Array(Math.ceil(capacity / 24));
    this.free = new Uint32Array(capacity);
    this.lifetimes = new Float32Array(capacity);
    this.freeCount = capacity;
    this.reset();
  }

  get revision(): number {
    return this.version;
  }

  /** Visit only live allocation metadata; no particle texture is inspected. */
  forEachLifetime(visitor: ParticleLifetimeVisitor): void {
    for (const batch of this.batches) {
      for (let index = batch.next; index < batch.slots.length; index++) {
        const slot = batch.slots[index]!;
        visitor(slot, batch.age, this.lifetimes[slot]!, batch.generation);
      }
    }
  }

  copyOrder(target: Uint32Array): number {
    if (!this.order) {
      throw new Error('Particle ordering is not enabled');
    }
    return this.order.copyTo(target);
  }

  get count(): number {
    return this.capacity - this.freeCount;
  }

  get empty(): boolean {
    return this.freeCount === this.capacity;
  }

  /** Expire before admission. Excess requests are dropped, never queued or overwritten. */
  advance(
    seconds: number,
    requested: number,
    lifetime: number,
    spread: number,
    seed: number,
    maximumLifetime = lifetime,
  ): number {
    const changed = seconds > 0 || requested > 0 || maximumLifetime !== this.maximumLifetime;
    this.maximumLifetime = maximumLifetime;
    if (changed) {
      this.version++;
    }
    this.spawnMask.fill(0);
    const step = Math.fround(seconds);
    if (seconds > 0) {
      this.expire(step);
    }
    const count = Math.min(requested, this.freeCount);
    if (count === 0) {
      if (changed) {
        this.sort();
      }
      return 0;
    }
    const slots = new Uint32Array(count);
    const initialLifetime = Math.fround(lifetime);
    const lifetimeSpread = Math.fround(spread);
    for (let index = 0; index < count; index++) {
      const slot = this.free[--this.freeCount]!;
      slots[index] = slot;
      this.order?.add(slot);
      let sampledLifetime = initialLifetime;
      if (spread > 0) {
        const variation = Math.fround(Math.fround(propertyVariation(slot, seed, 2) + 1) - 1);
        sampledLifetime = Math.fround(initialLifetime + Math.fround(lifetimeSpread * variation));
      }
      this.lifetimes[slot] = sampledLifetime;
      const word = Math.floor(slot / 24);
      this.spawnMask[word] = this.spawnMask[word]! + 2 ** (slot % 24);
    }
    if (spread > 0) {
      slots.sort((a, b) => this.lifetimes[a]! - this.lifetimes[b]! || a - b);
    }
    // Even nonpositive lifetimes retain their birth frame.
    this.batches.push({ slots, next: 0, age: step, generation: this.version });
    this.sort();
    return count;
  }

  private sort(): void {
    const order = this.order;
    if (!order) {
      return;
    }
    this.forEachLifetime((slot, age, lifetime) => {
      order.setLifetime(slot, age, lifetime, this.maximumLifetime);
    });
    order.sort();
  }

  reset(): void {
    this.version++;
    this.order?.reset();
    this.batches = [];
    this.freeCount = this.capacity;
    this.spawnMask.fill(0);
    for (let index = 0; index < this.capacity; index++) {
      this.free[index] = this.capacity - index - 1;
    }
  }

  private expire(seconds: number): void {
    let retained = 0;
    for (const batch of this.batches) {
      batch.age = Math.fround(batch.age + seconds);
      while (batch.next < batch.slots.length) {
        const slot = batch.slots[batch.next]!;
        if (batch.age <= this.lifetimes[slot]!) {
          break;
        }
        this.order?.expire(slot);
        this.free[this.freeCount++] = slot;
        batch.next++;
      }
      if (batch.next < batch.slots.length) {
        // Bound retained slot storage when a long-lived tail outlasts most of its batch.
        if (batch.next > batch.slots.length / 2) {
          batch.slots = batch.slots.slice(batch.next);
          batch.next = 0;
        }
        this.batches[retained++] = batch;
      }
    }
    this.batches.length = retained;
    this.order?.removeExpired();
  }
}
