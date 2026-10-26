import type { z } from 'zod/mini';

import type { effectConfigSchema } from '#config/schemas/definition/effect.js';
import type { emitterConfigSchema } from '#config/schemas/definition/emitter.js';
import type { modifierSchema } from '#config/schemas/definition/modifiers.js';
import type { emitterSchema } from '#config/schemas/runtime/emitter.js';

/**
 * Parsed effect definition with schema defaults applied.
 * Contains at least one emitter with a unique ID and an effect-level modifier list.
 * Rendering settings contain shared appearance only; artwork belongs to the renderer.
 * @interface
 */
export type EffectConfig = z.output<typeof effectConfigSchema>;

/**
 * Authoring input before defaults and validation.
 * @interface
 */
export type EffectInput = z.input<typeof effectConfigSchema>;

/**
 * Emitter authoring input before defaults and validation.
 * @interface
 */
export type EmitterInput = z.input<typeof emitterConfigSchema>;

/**
 * Validated emitter data, including the shared rendering contract.
 * @interface
 */
export type EmitterConfig = z.output<typeof emitterConfigSchema>;

/**
 * Parsed acceleration, drag, radial, or vortex modifier with defaults applied.
 * Narrow by `type` to access fields specific to that modifier. The same definition
 * type is used for emitter-level and effect-level modifier lists.
 */
export type ModifierConfig = z.infer<typeof modifierSchema>;

/**
 * Input patch for changing an existing emitter through setParameters().
 * Omitted fields retain their current values; a supplied modifier list replaces
 * the whole list. Only fields exposed by the runtime schema can be changed.
 *
 * Uses the schema's input type so callers may omit modifier fields with defaults.
 * mergeEmitterParameters() validates the patch and the resulting complete definition.
 * @interface
 */
export type EmitterParameters = z.input<typeof emitterSchema>;
