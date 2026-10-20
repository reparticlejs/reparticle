import { ParticleSlots, SpawnSchedule } from '@reparticle/core';

/** Replays allocation for the overlay without reading particle textures. */
export class LiveParticleCount {
  private readonly slots: ParticleSlots;
  private readonly schedule: SpawnSchedule;

  public constructor(capacity: number) {
    this.slots = new ParticleSlots(capacity);
    this.schedule = new SpawnSchedule(capacity);
  }

  public get count(): number {
    return this.slots.count;
  }

  public advance(seconds: number, rate: number, lifetime: number, spread = 0, seed = 1): number {
    return this.recordStep(seconds, this.schedule.next(rate, seconds), lifetime, spread, seed);
  }

  public recordStep(
    seconds: number,
    requested: number,
    lifetime: number,
    spread = 0,
    seed = 1,
  ): number {
    return this.slots.advance(seconds, requested, lifetime, spread, seed);
  }
}
