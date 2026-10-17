import type { ScalarProperty } from '#types/curve.js';

import { SampledCurve } from './curves/sampled-curve';

/** Absolute particles per second, clamped after evaluating the emitter-time curve. */
export class SpawnRate {
  private readonly curve: SampledCurve;

  constructor(property: ScalarProperty) {
    this.curve = new SampledCurve(property);
  }

  at(normalizedAge: number): number {
    return Math.max(0, this.curve.at(normalizedAge));
  }
}
