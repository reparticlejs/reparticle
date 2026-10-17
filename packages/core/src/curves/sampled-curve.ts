import type { ScalarProperty } from '#types/curve.js';

import { CURVE_SEGMENTS, sampleCurve } from './sample-curve';

/** Cached Hermite samples evaluated through linear interpolation. */
export class SampledCurve {
  private readonly samples: Float32Array;

  constructor(property: ScalarProperty) {
    this.samples = sampleCurve(property);
  }

  at(normalizedAge: number): number {
    const position = Math.max(0, Math.min(1, normalizedAge)) * CURVE_SEGMENTS;
    const segment = Math.min(Math.floor(position), CURVE_SEGMENTS - 1);
    const left = this.samples[segment]!;
    const right = this.samples[segment + 1]!;
    return left + (right - left) * (position - segment);
  }
}
