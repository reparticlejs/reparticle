import type { Ticker } from 'pixi.js';

import type { ParticleRendering } from '#types/particle-rendering.js';

/** Artwork can target one emitter directly or select multiple emitters by ID. */
export type ParticleEffectOptions = (
  | ParticleRendering
  | { emitters: Record<string, ParticleRendering> }
) & {
  /** Automatically advance before rendering. Defaults to true. Disable for manual update(seconds). */
  autoUpdate?: boolean;
  /** Ticker used for automatic updates. Defaults to Ticker.shared; the effect never owns it. */
  ticker?: Ticker;
};
