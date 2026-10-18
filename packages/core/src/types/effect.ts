import type { z } from 'zod';

import type {
  modifiersSchema,
  effectConfigSchema,
  emitterConfigSchema,
  emitterParametersSchema,
} from '#src/config/schema.js';

/** Validated effect definition; inferred from the runtime schema. */
export type EffectConfig = z.infer<typeof effectConfigSchema>;
export type EmitterConfig = z.infer<typeof emitterConfigSchema>;

export type EmitterParameters = z.infer<typeof emitterParametersSchema>;

export type ModifierConfig = z.infer<typeof modifiersSchema>;
