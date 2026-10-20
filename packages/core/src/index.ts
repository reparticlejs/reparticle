export { Emitter } from './runtime/emitter';
export type { EmitterContext } from '#types/emitter.js';
export { parseEffectConfig } from './config/parse-effect';
export { effectConfigSchema } from './config/schemas/definition/effect';
export { emitterConfigSchema } from './config/schemas/definition/emitter';
export type { EffectConfig, EmitterConfig, EmitterParameters } from '#types/effect.js';

export { EmitterPlayback } from './runtime/playback/emitter';
export { propertyVariation } from './simulation/emission/variation';
export { SampledCurve } from './curves/sampled-curve';
export { SpawnRate } from './runtime/playback/spawn-rate';
export { prewarm } from './runtime/playback/prewarm';

export { sampleCurve, CURVE_SEGMENTS } from './curves/sample-curve';
export type { Curve, CurvePoint, ScalarProperty } from '#types/curve.js';

export type { ModifierConfig } from '#types/effect.js';

export type {
  EmitterState,
  EmitterStateChange,
  EmitterStateListener,
  StopOptions,
} from '#types/lifecycle.js';

export { EffectTransform } from './runtime/transforms/effect';
export type { Transform } from '#types/transform.js';

export { ParticleSlots } from './runtime/particles/slots';
export { SpawnSchedule } from './runtime/playback/spawn-schedule';

export type { ParticleLifetimeVisitor } from '#types/particle-lifetime.js';
