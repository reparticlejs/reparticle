import { CURVE_SEGMENTS } from '#curves/sample-curve.js';
import { SampledCurve } from '#curves/sampled-curve.js';
import { propertyVariation } from '#simulation/emission/variation.js';
import type { ScalarProperty } from '#types/curve.js';

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

  /** Average the nonnegative rate across a step, including every crossed curve segment. */
  public average(start: number, end: number): number {
    if (end <= start) {
      return this.at(start);
    }
    let area = 0;
    let left = start;
    // Cached curves are piecewise linear. Integrate each segment exactly;
    // sampling only the frame endpoint can skip a short burst entirely.
    while (left < end) {
      const boundary = (Math.floor(left * CURVE_SEGMENTS) + 1) / CURVE_SEGMENTS;
      const right = Math.min(end, boundary);
      const a = this.curve.at(left) + this.spreadOffset;
      const b = this.curve.at(right) + this.spreadOffset;
      const width = right - left;
      if (a >= 0 && b >= 0) {
        area += (a + b) * 0.5 * width;
      } else if (a > 0 || b > 0) {
        // Only the positive triangle contributes when the segment crosses zero.
        const positive = Math.max(a, b);
        area += 0.5 * width * positive * (positive / Math.abs(b - a));
      }
      left = right;
    }
    return area / (end - start);
  }
}
