import type { SampledCurve } from '#src/curves/sampled-curve.js';

/**
 * Cached birth-property curves evaluated at normalized emitter age.
 * Time 0 is the start of the emission cycle and 1 is its end; these curves do
 * not follow individual particle ages. Constants use the same sampled form.
 *
 * sampleInitialProperties() builds this set and reuses unchanged curves for
 * runtime patches. Per-particle spreads and birth transforms are applied
 * separately, after evaluation; neither is baked into these samples.
 */
export interface InitialPropertyCurves {
  /** Particle lifespan in seconds. Also supplies the maximum used for prewarm. */
  lifetime: SampledCurve;

  /** Initial travel speed in units per second. */
  speed: SampledCurve;

  /** Base particle size in units, before lifetime scaling and axis stretch. */
  size: SampledCurve;

  /** Initial orientation in counterclockwise degrees, before birth alignment. */
  rotation: SampledCurve;

  /** Initial spin in degrees per second, used by angular-velocity orientation. */
  angularVelocity: SampledCurve;

  /** Additive X stretch: 0 leaves size unchanged, 1 doubles it, -1 collapses it. */
  stretchX: SampledCurve;

  /** Additive Y stretch, using the same dimensionless convention as stretchX. */
  stretchY: SampledCurve;

  /** Initial RGB components; 1 preserves the corresponding texture channel. */
  red: SampledCurve;
  green: SampledCurve;
  blue: SampledCurve;

  /** Initial opacity factor; 0 is transparent and 1 preserves texture alpha. */
  alpha: SampledCurve;
}
