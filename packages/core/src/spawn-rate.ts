import type { ScalarProperty } from '#types/curve.js';

import { propertyVariation } from './behaviors/property-variation';
import { SampledCurve } from './curves/sampled-curve';

/** Absolute particles per second, clamped after evaluating the emitter-time curve. */
export class SpawnRate {
  private readonly curve: SampledCurve;

  private readonly offset: number;

  constructor(property: ScalarProperty, spread = 0, seed = 0) {
    this.offset = propertyVariation(0, seed, 11) * spread;
    this.curve = new SampledCurve(property);
  }

  at(normalizedAge: number): number {
    return Math.max(0, this.curve.at(normalizedAge) + this.offset);
  }
}
