import type { ScalarProperty } from '#types/curve.js';

import { CURVE_SEGMENTS, sampleCurve } from './sample-curve';

/** Cached Hermite samples evaluated through linear interpolation. */
export class SampledCurve {
  private readonly samples: Float32Array;

  public constructor(property: ScalarProperty) {
    this.samples = sampleCurve(property);
  }

  public get maximum(): number {
    return Math.max(...this.samples);
  }

  public at(normalizedAge: number): number {
    return this.extrapolate(Math.min(1, normalizedAge));
  }

  /** Continue the final sampled line beyond one for modifier curves. */
  public extrapolate(normalizedAge: number): number {
    const position = Math.max(0, normalizedAge) * CURVE_SEGMENTS;
    const segment = Math.min(Math.floor(position), CURVE_SEGMENTS - 1);
    const left = this.samples[segment]!;
    const right = this.samples[segment + 1]!;
    return left + (right - left) * (position - segment);
  }
}
