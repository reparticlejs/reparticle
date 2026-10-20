import type { ParticleLifetimeVisitor } from '#types/particle-lifetime.js';
import type { ParticleSlotBatch } from '#types/particle-slots.js';

import { propertyVariation } from '../../simulation/emission/variation';
import { ParticleOrder } from './order';

// Every integer up to 24 bits is represented exactly by a float32.
const SLOTS_PER_MASK_WORD = 24;

/**
 * Allocate fixed GPU slots using CPU lifetime metadata, without texture readbacks.
 * Births from one step share an age and form a batch sorted by lifetime. This
 * lets expiration consume each batch from the front instead of scanning capacity.
 * Living slots are never overwritten; requests beyond available capacity are dropped.
 */
export class ParticleSlots {
  /** Packed birth flags for the current step: one bit per newly admitted slot. */
  public readonly spawnMask: Float32Array;

  private version = 0;
  private readonly order: ParticleOrder | undefined;
  private maximumLifetime = NaN;
  // Free slots form a stack; only entries below freeCount are available.
  private readonly free: Uint32Array;
  private readonly lifetimes: Float32Array;
  private freeCount: number;
  private batches: ParticleSlotBatch[] = [];

  public constructor(
    private readonly capacity: number,
    trackOrder = false,
  ) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1_000_000) {
      throw new RangeError('Capacity must be an integer from 1 to 1,000,000');
    }
    this.order = trackOrder ? new ParticleOrder(capacity) : undefined;
    this.spawnMask = new Float32Array(Math.ceil(capacity / SLOTS_PER_MASK_WORD));
    this.free = new Uint32Array(capacity);
    this.lifetimes = new Float32Array(capacity);
    this.freeCount = capacity;
    this.reset();
  }

  /** Changes when allocation metadata may change, even if draw order stays identical. */
  public get revision(): number {
    return this.version;
  }

  /** Visit only live allocation metadata; no particle texture is inspected. */
  public forEachLifetime(visitor: ParticleLifetimeVisitor): void {
    for (const batch of this.batches) {
      for (let index = batch.next; index < batch.slots.length; index++) {
        const slot = batch.slots[index]!;
        visitor(slot, batch.age, this.lifetimes[slot]!, batch.generation);
      }
    }
  }

  /** Copy sorted live slot IDs; requires trackOrder to be enabled at construction. */
  public copyOrder(target: Uint32Array): number {
    if (!this.order) {
      throw new Error('Particle ordering is not enabled');
    }
    return this.order.copyTo(target);
  }

  public get count(): number {
    return this.capacity - this.freeCount;
  }

  public get empty(): boolean {
    return this.freeCount === this.capacity;
  }

  /**
   * Advance existing particles, admit births into free slots, then refresh ordering.
   * Returns the accepted birth count. Excess requests are dropped, never queued.
   * Lifetimes and ages use float32 rounding to match GPU expiration decisions.
   */
  public advance(
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

    this.admit(count, step, lifetime, spread, seed);
    this.sort();
    return count;
  }

  /** Clear all allocations and restore ascending slot allocation order. */
  public reset(): void {
    this.version++;
    this.order?.reset();
    this.batches = [];
    this.freeCount = this.capacity;
    this.spawnMask.fill(0);
    for (let index = 0; index < this.capacity; index++) {
      this.free[index] = this.capacity - index - 1;
    }
  }

  /** Build one birth batch, recording lifetimes and setting the GPU spawn bits. */
  private admit(count: number, step: number, lifetime: number, spread: number, seed: number): void {
    const slots = new Uint32Array(count);
    const initialLifetime = Math.fround(lifetime);
    const lifetimeSpread = Math.fround(spread);

    for (let index = 0; index < count; index++) {
      const slot = this.free[--this.freeCount]!;
      slots[index] = slot;
      this.order?.add(slot);

      let sampledLifetime = initialLifetime;
      if (spread > 0) {
        // Match the GPU's intermediate rounding, not just the final lifetime.
        const variation = Math.fround(Math.fround(propertyVariation(slot, seed, 2) + 1) - 1);
        sampledLifetime = Math.fround(initialLifetime + Math.fround(lifetimeSpread * variation));
      }
      this.lifetimes[slot] = sampledLifetime;

      const word = Math.floor(slot / SLOTS_PER_MASK_WORD);
      this.spawnMask[word] = this.spawnMask[word]! + 2 ** (slot % SLOTS_PER_MASK_WORD);
    }

    // All births share an age. Shortest lifetimes expire first; slot ID breaks ties.
    if (spread > 0) {
      slots.sort((a, b) => this.lifetimes[a]! - this.lifetimes[b]! || a - b);
    }

    // Even nonpositive lifetimes retain their birth frame.
    this.batches.push({ slots, next: 0, age: step, generation: this.version });
  }

  /** Refresh lifetime keys without moving the particles in their GPU slots. */
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

  private expire(seconds: number): void {
    let retainedBatchCount = 0;
    for (const batch of this.batches) {
      batch.age = Math.fround(batch.age + seconds);
      while (batch.next < batch.slots.length) {
        const slot = batch.slots[batch.next]!;
        // Equality stays alive. Later entries cannot expire before this one.
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
        this.batches[retainedBatchCount++] = batch;
      }
    }
    this.batches.length = retainedBatchCount;
    // Apply logical swap-removal after every expired slot has been marked.
    this.order?.removeExpired();
  }
}
