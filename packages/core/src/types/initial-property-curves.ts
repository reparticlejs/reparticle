import type { SampledCurve } from '../curves/sampled-curve';

/** Cached emitter-time curves used to initialize newly born particles. */
export interface InitialPropertyCurves {
  lifetime: SampledCurve;
  speed: SampledCurve;
  size: SampledCurve;
  rotation: SampledCurve;
  angularVelocity: SampledCurve;
  stretchX: SampledCurve;
  stretchY: SampledCurve;
  red: SampledCurve;
  green: SampledCurve;
  blue: SampledCurve;
  alpha: SampledCurve;
}
