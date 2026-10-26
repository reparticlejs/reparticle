import type { ParticleEffect } from '@reparticle/pixi';

/** A text overlay observing one effect at a time, without owning that effect. */
export interface Stats {
  /** Reset the sample when switching effects; undefined clears the particle count. */
  setEffect(effect: ParticleEffect | undefined): void;
  /** Remove the overlay and its ticker callback. */
  destroy(): void;
}
