import type { LifetimeBatch } from '#types/lifecycle.js';

import { lifetimeVariation } from './lifetime-variation';

/** Tracks the last expiry of each spawn batch, not individual particles or a live count. */
export class ParticleLifetimes {
  private batches: LifetimeBatch[] = [];
  private spawned = 0;

  constructor(private readonly capacity: number) {}

  get empty(): boolean {
    return this.batches.length === 0;
  }

  advance(seconds: number, count: number, lifetime: number, spread: number, seed: number): void {
    const end = this.spawned + count;
    const oldest = end - this.capacity;
    const step = Math.fround(seconds);
    this.batches = this.batches.filter((batch) => {
      if (batch.end <= oldest) {
        return false;
      }
      if (batch.start < oldest) {
        batch.start = oldest;
        batch.maximum = this.maximum(batch);
      }
      batch.age = Math.fround(batch.age + step);
      return seconds === 0 || batch.age <= batch.maximum;
    });
    if (count > 0) {
      const batch: LifetimeBatch = {
        start: this.spawned,
        end,
        age: step,
        lifetime: Math.fround(lifetime),
        spread: Math.fround(spread),
        seed,
        maximum: 0,
      };
      batch.maximum = this.maximum(batch);
      // Newborns survive their birth frame, even when their lifetime is already exceeded.
      this.batches.push(batch);
    }
    this.spawned = end;
  }

  reset(): void {
    this.batches = [];
    this.spawned = 0;
  }

  private maximum(batch: LifetimeBatch): number {
    if (batch.spread === 0) {
      return batch.lifetime;
    }
    const start = batch.start % this.capacity;
    const count = batch.end - batch.start;
    const beforeWrap = Math.min(count, this.capacity - start);
    let factor = lifetimeVariation(start, beforeWrap, batch.seed);
    if (beforeWrap < count) {
      factor = Math.max(factor, lifetimeVariation(0, count - beforeWrap, batch.seed));
    }
    return Math.fround(batch.lifetime + Math.fround(batch.spread * factor));
  }
}
