export { Emitter } from './runtime/emitter';
export type { EmitterContext } from '#types/emitter.js';
export { parseEffectConfig } from './config/effect';
export { effectConfigSchema, emitterConfigSchema } from './config/schema';
export type { EffectConfig, EmitterConfig, EmitterParameters } from '#types/effect.js';

export { EmitterPlayback } from './runtime/emitter-playback';
export { propertyVariation } from './simulation/emission/variation';
export { SampledCurve } from './curves/sampled-curve';
export { SpawnRate } from './runtime/spawn-rate';
export { prewarm } from './runtime/prewarm';

export { sampleCurve, CURVE_SEGMENTS } from './curves/sample-curve';
export type { Curve, CurvePoint, ScalarProperty } from '#types/curve.js';

export type { ModifierConfig } from '#types/effect.js';

export type {
  EmitterState,
  EmitterStateChange,
  EmitterStateListener,
  StopOptions,
} from '#types/lifecycle.js';

export { EffectTransform } from './runtime/effect-transform';
export type { Transform } from '#types/transform.js';

export { ParticleSlots } from './runtime/particle-slots';
export { SpawnSchedule } from './runtime/spawn-schedule';

export type { ParticleLifetimeVisitor } from '#types/particle-lifetime.js';
