import type { ParticleEffect } from '@reparticle/pixi';

/** A mounted effect with its own playback and cleanup, sharing the Pixi application. */
export interface MountedExample {
  effect: ParticleEffect;
  /** Reset motion and particles, then resume playback. */
  restart(): void;
  /** Release the effect and its listeners; cached artwork stays available. */
  destroy(): void;
}
