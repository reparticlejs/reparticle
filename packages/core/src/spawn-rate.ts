import type { ScalarProperty } from '#types/curve.js';

import { CURVE_SEGMENTS, sampleCurve } from './curves/sample-curve';

/** Absolute particles per second, sampled once and evaluated on the emitter clock. */
export class SpawnRate {
  private readonly samples: Float32Array;

  constructor(property: ScalarProperty) {
    this.samples = sampleCurve(property);
  }

  at(normalizedAge: number): number {
    const position = Math.max(0, Math.min(1, normalizedAge)) * CURVE_SEGMENTS;
    const segment = Math.min(Math.floor(position), CURVE_SEGMENTS - 1);
    const left = this.samples[segment]!;
    const right = this.samples[segment + 1]!;
    return Math.max(0, left + (right - left) * (position - segment));
  }
}
