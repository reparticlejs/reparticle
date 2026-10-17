import type { EmitterConfig } from './effect.js';

export type PlaybackVariation = Partial<
  Pick<EmitterConfig, 'seed' | 'durationSpread' | 'startDelaySpread'>
>;
