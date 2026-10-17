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
  advance(seconds: number, rate: number, lifetime: number): void {
    const total = this.carry + rate * seconds;
    const whole = Math.floor(total + 1e-9);
    this.carry = Math.max(0, total - whole);
    this.update(seconds, Math.min(whole, this.capacity), lifetime);
  }

  update(seconds: number, spawned: number, lifetime: number): void {
    const end = this.emitted + spawned;
    const oldestSlot = end - this.capacity;
    const step = Math.fround(seconds);
    let retained = 0;
    let alive = 0;

    for (const batch of this.batches) {
      // Match the float32 age accumulation used by the simulation texture.
      batch.age = Math.fround(batch.age + step);
      batch.start = Math.max(batch.start, oldestSlot);
      if (batch.age < batch.lifetime && batch.start < batch.end) {
        this.batches[retained++] = batch;
        alive += batch.end - batch.start;
      }
    }
    this.batches.length = retained;

    if (spawned > 0) {
      const particleLifetime = Math.fround(lifetime);
      if (particleLifetime > 0) {
        this.batches.push({ start: this.emitted, end, age: 0, lifetime: particleLifetime });
        alive += spawned;
      }
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
