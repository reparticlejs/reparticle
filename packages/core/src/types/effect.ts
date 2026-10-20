import type { z } from 'zod';

import type { effectConfigSchema } from '#src/config/schemas/effect.js';
import type { emitterParametersSchema } from '#src/config/schemas/emitter-parameters.js';
import type { emitterConfigSchema } from '#src/config/schemas/emitter.js';
import type { modifierSchema } from '#src/config/schemas/modifiers.js';

/** Validated effect definition; inferred from the runtime schema. */
export type EffectConfig = z.infer<typeof effectConfigSchema>;
export type EmitterConfig = z.infer<typeof emitterConfigSchema>;

export type EmitterParameters = z.input<typeof emitterParametersSchema>;

export type ModifierConfig = z.infer<typeof modifierSchema>;
