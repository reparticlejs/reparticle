import type { ScalarProperty } from '#types/curve.js';

import { evaluateCurve } from './evaluate-curve';

/** Number of intervals in the sampled curve, not the number of stored values. */
export { CURVE_SEGMENTS } from '#simulation/layout.js';
import { CURVE_SEGMENTS } from '#simulation/layout.js';

/**
 * Bake a constant or validated curve into 65 evenly spaced float32 values.
 * Includes both endpoints: time 0 at index 0 and time 1 at index 64.
 * Playback interpolates between adjacent samples instead of evaluating Hermite
 * curves each frame. Constants produce the same value at every sample.
 *
 * Throws if a sampled value is nonfinite or overflows float32 storage.
 */
export function sampleCurve(property: ScalarProperty): Float32Array {
  const sampleCount = CURVE_SEGMENTS + 1;
  const samples = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index++) {
    const time = index / CURVE_SEGMENTS;
    samples[index] = evaluateCurve(property, time);

    // Check after conversion: a finite JavaScript number can overflow float32.
    if (!Number.isFinite(samples[index])) {
      throw new RangeError('Curve values must fit in a float32 sample');
    }
  }

  return samples;
}
