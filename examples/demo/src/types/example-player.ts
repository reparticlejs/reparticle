import type { ParticleEffect } from '@reparticle/pixi';

import type { Example } from './example';

/** A mounted effect with its own playback and cleanup, sharing the Pixi application. */
export interface LoadedExample {
  particles: ParticleEffect;
  /** Reset motion and particles, then resume playback. */
  restart(): void;
  /** Release the effect and its listeners; cached artwork stays available. */
  destroy(): void;
}

export interface ExamplePlayer {
  /**
   * Remove the previous effect and load this selection.
   * Returns true when mounted, false when cancelled or destroyed. Load failures reject.
   */
  select(example: Example): Promise<boolean>;
  /** Pause or resume the active effect; does nothing while loading. */
  setPaused(paused: boolean): void;
  /** Reset and resume the active effect, including its display-object movement. */
  restart(): void;
  /** Cancel loading and release the effect. Safe to call more than once. */
  destroy(): void;
}
