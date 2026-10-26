import type { SampledCurve } from '#curves/sampled-curve.js';

import type { ModifierConfig } from './effect.js';

/** Validated modifier paired with its reusable magnitude curve. */
export interface SampledModifier {
  definition: ModifierConfig;
  magnitude: SampledCurve;
}
