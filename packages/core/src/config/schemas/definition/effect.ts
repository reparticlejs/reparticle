import { z, _default as defaultValue } from 'zod/mini';

import { emitterConfigSchema } from './emitter';
import { modifiersSchema } from './modifiers';

function validateUniqueEmitterIds(
  emitters: { id: string }[],
  context: z.core.$RefinementCtx<{ id: string }[]>,
): void {
  const ids = new Set<string>();
  for (const [index, emitter] of emitters.entries()) {
    if (ids.has(emitter.id)) {
      context.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: `Duplicate emitter ID: ${emitter.id}`,
      });
    }
    ids.add(emitter.id);
  }
}

// A required first emitter preserves the nonempty-array type after validation.
const nonEmptyEmittersSchema = z.tuple([emitterConfigSchema], emitterConfigSchema);

/**
 * Zod Mini schema for effect JSON. Use `.parse()` or `.safeParse()` to validate.
 * Only implemented configuration features are accepted. Compose schemas with
 * functions from `zod/mini`; validation errors expose an `issues` array.
 */
export const effectConfigSchema = z.strictObject({
  version: z.literal(1),
  modifiers: defaultValue(modifiersSchema, []),
  emitters: nonEmptyEmittersSchema.check(z.superRefine(validateUniqueEmitterIds)),
});
