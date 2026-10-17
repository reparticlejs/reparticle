import type { ScalarProperty } from '#types/curve.js';

import { evaluateCurve } from './evaluate-curve';

/** Defold approximates each property with 64 linear segments over [0, 1]. */
export const CURVE_SEGMENTS = 64;

export function sampleCurve(property: ScalarProperty): Float32Array {
  const samples = new Float32Array(CURVE_SEGMENTS + 1);
  for (let index = 0; index <= CURVE_SEGMENTS; index++) {
    samples[index] = evaluateCurve(property, index / CURVE_SEGMENTS);
    if (!Number.isFinite(samples[index])) {
      throw new RangeError('Curve values must fit in a float32 sample');
    }
  }
  return samples;
}
