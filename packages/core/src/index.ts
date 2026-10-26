import { config } from 'zod/mini';
import en from 'zod/v4/locales/en.js';

// Keep English validation messages for every public schema and engine entry point.
config(en());

// Configuration and validation.
export { parseEffectConfig } from '#config/parse-effect.js';
export { effectConfigSchema } from '#config/schemas/definition/effect.js';
export { emitterConfigSchema } from '#config/schemas/definition/emitter.js';
export type {
  EffectConfig,
  EffectInput,
  EmitterConfig,
  EmitterInput,
  EmitterParameters,
  ModifierConfig,
} from '#types/effect.js';

export { renderingSchema } from '#config/schemas/definition/rendering.js';
export type {
  RenderingConfig,
  RenderingInput,
  ParticleBlendMode,
  ParticleTint,
} from '#types/rendering.js';

// Runtime.
export { Emitter } from '#runtime/emitter.js';
export type { EmitterContext } from '#types/emitter.js';
export type {
  EmitterState,
  EmitterStateChange,
  EmitterStateListener,
  StopOptions,
} from '#types/lifecycle.js';

export { EffectTransform } from '#runtime/transforms/effect.js';
export type { Transform } from '#types/transform.js';

export { EmitterPlayback } from '#runtime/playback/emitter.js';
export { SpawnRate } from '#runtime/playback/spawn-rate.js';
export { SpawnSchedule } from '#runtime/playback/spawn-schedule.js';
export { prewarm } from '#runtime/playback/prewarm.js';

export { ParticleSlots } from '#runtime/particles/slots.js';
export type { ParticleLifetimeVisitor } from '#types/particle-lifetime.js';
export { propertyVariation } from '#simulation/emission/variation.js';

// Curve sampling.
export { SampledCurve } from '#curves/sampled-curve.js';
export { sampleCurve, CURVE_SEGMENTS } from '#curves/sample-curve.js';
export type { Curve, CurvePoint, ScalarProperty } from '#types/curve.js';
