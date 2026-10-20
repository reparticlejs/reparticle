import type { ScalarProperty } from '#types/curve.js';

import { SampledCurve } from '../../curves/sampled-curve';
import { propertyVariation } from '../../simulation/emission/variation';

// Dedicated random channel for the emitter's rate variation.
const RATE_VARIATION_CHANNEL = 11;

/**
 * Evaluate births per second over emitter lifetime, not individual particle age.
 * A seeded spread offset is sampled once and stays fixed across evaluations.
 * SpawnSchedule converts the resulting rate into a whole-particle request.
 */
export class SpawnRate {
  private readonly curve: SampledCurve;
  private readonly spreadOffset: number;

  /** Spread is an absolute half-range in particles per second, not a percentage. */
  public constructor(rate: ScalarProperty, spread = 0, seed = 0) {
    // Slot zero supplies one emitter-level sample, rather than a sample per particle.
    this.spreadOffset = propertyVariation(0, seed, RATE_VARIATION_CHANNEL) * spread;
    this.curve = new SampledCurve(rate);
  }

  /**
   * Read the curve at normalized emitter age (0–1), then add spread and clamp.
   * Clamping happens last so a positive offset can lift a negative curve value.
   * Times outside the range use the curve's endpoint values.
   */
  public at(normalizedEmitterAge: number): number {
    const baseRate = this.curve.at(normalizedEmitterAge);
    return Math.max(0, baseRate + this.spreadOffset);
  }
}
