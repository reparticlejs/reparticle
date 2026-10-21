import type { Ticker } from 'pixi.js';

import type { ParticleTexture } from './particle-texture';

/** Pixi artwork bindings and runtime integration, separate from the effect definition. */
export interface ParticleEffectOptions {
  /** Artwork keyed by emitter ID. Omitted emitters use procedural particles. */
  emitters?: Readonly<Record<string, ParticleTexture>>;

  /** Defaults to true. Disable when calling update(seconds) yourself. */
  autoUpdate?: boolean;
  /** Defaults to Ticker.shared. The effect does not own this ticker. */
  ticker?: Ticker;
}
