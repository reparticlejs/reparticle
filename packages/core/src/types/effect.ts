import type { z } from 'zod';

import type { effectConfigSchema } from '#src/config/schemas/definition/effect.js';
import type { emitterConfigSchema } from '#src/config/schemas/definition/emitter.js';
import type { modifierSchema } from '#src/config/schemas/definition/modifiers.js';
import type { emitterSchema } from '#src/config/schemas/runtime/emitter.js';

/**
 * Parsed effect definition with schema defaults applied.
 * Contains at least one emitter with a unique ID and an effect-level modifier list.
 * Texture assets and animation settings belong to the renderer's configuration.
 */
export type EffectConfig = z.infer<typeof effectConfigSchema>;

/**
 * Parsed definition for one emitter, including allocation, playback, transforms,
 * birth properties, lifetime curves, and modifiers. Schema defaults are present;
 * this is the resolved configuration, not the shape of unparsed JSON.
 */
export type EmitterConfig = z.infer<typeof emitterConfigSchema>;

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
 * applyEmitterPatch() validates the patch and the resulting complete definition.
 */
export type EmitterParameters = z.input<typeof emitterSchema>;
