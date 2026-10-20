import type { EmitterConfig } from '#types/effect.js';

/**
 * Optional timing variation supplied when constructing EmitterPlayback.
 * Duration and delay are sampled independently once, then retained across loops
 * and resets. Omitted values default to zero in the playback constructor.
 */
export interface PlaybackVariation {
  /** Deterministic sampling seed, using the emitter definition's seed. */
  seed?: EmitterConfig['seed'];

  /**
   * Random half-range added to the authored duration, in seconds.
   * The sampled duration is clamped to zero if it would be negative.
   */
  durationSpread?: EmitterConfig['durationSpread'];

  /**
   * Random half-range added to the authored start delay, in seconds.
   * A negative sampled delay advances the initial cycle age instead of waiting.
   */
  startDelaySpread?: EmitterConfig['startDelaySpread'];
}
