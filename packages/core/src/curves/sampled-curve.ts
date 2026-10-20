import type { ScalarProperty } from '#types/curve.js';

import { CURVE_SEGMENTS, sampleCurve } from './sample-curve';

/**
 * Samples a constant or authored curve once, then interpolates between cached
 * values during playback. Times are normalized: 0 is the start, 1 is the end.
 */
export class SampledCurve {
  private readonly samples: Float32Array;

  public constructor(property: ScalarProperty) {
    this.samples = sampleCurve(property);
  }

  /** Largest stored sample; not the exact maximum of the original Hermite curve. */
  public get maximum(): number {
    return Math.max(...this.samples);
  }

  /** Evaluate within [0, 1], holding the endpoint value outside that range. */
  public at(normalizedTime: number): number {
    return this.extrapolate(Math.min(1, normalizedTime));
  }

  /**
   * Hold the first sample before time 0, but extend the final straight segment
   * after time 1. Modifier curves use this when their playback time exceeds one.
   * This extends the sampled line, not the original Hermite polynomial.
   */
  public extrapolate(normalizedTime: number): number {
    const samplePosition = Math.max(0, normalizedTime) * CURVE_SEGMENTS;
    const lastSegmentIndex = CURVE_SEGMENTS - 1;
    const segmentIndex = Math.min(Math.floor(samplePosition), lastSegmentIndex);

    const startValue = this.samples[segmentIndex]!;
    const endValue = this.samples[segmentIndex + 1]!;

    // Progress exceeds 1 past the final sample, extending the segment's slope.
    const segmentProgress = samplePosition - segmentIndex;
    return startValue + (endValue - startValue) * segmentProgress;
  }
}
