// Effect definitions and validation.
export { parseEffectConfig } from './config/parse-effect';
export { effectConfigSchema } from './config/schemas/definition/effect';
export { emitterConfigSchema } from './config/schemas/definition/emitter';
export type {
  EffectConfig,
  EmitterConfig,
  EmitterParameters,
  ModifierConfig,
} from '#types/effect.js';

// Emitter runtime and lifecycle.
export { Emitter } from './runtime/emitter';
export type { EmitterContext } from '#types/emitter.js';
export type {
  EmitterState,
  EmitterStateChange,
  EmitterStateListener,
  StopOptions,
} from '#types/lifecycle.js';

// Effect transforms.
export { EffectTransform } from './runtime/transforms/effect';
export type { Transform } from '#types/transform.js';

// Curve sampling.
export { SampledCurve } from './curves/sampled-curve';
export { sampleCurve, CURVE_SEGMENTS } from './curves/sample-curve';
export type { Curve, CurvePoint, ScalarProperty } from '#types/curve.js';

// Playback and birth scheduling.
export { EmitterPlayback } from './runtime/playback/emitter';
export { SpawnRate } from './runtime/playback/spawn-rate';
export { SpawnSchedule } from './runtime/playback/spawn-schedule';
export { prewarm } from './runtime/playback/prewarm';

// CPU allocation metadata and deterministic variation.
export { ParticleSlots } from './runtime/particles/slots';
export type { ParticleLifetimeVisitor } from '#types/particle-lifetime.js';
export { propertyVariation } from './simulation/emission/variation';
