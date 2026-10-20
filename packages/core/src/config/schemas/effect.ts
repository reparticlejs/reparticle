import { literal, strictObject, tuple, type RefinementCtx } from 'zod';

import { emitterConfigSchema } from './emitter';
import { modifiersSchema } from './modifiers';

function validateUniqueEmitterIds(emitters: { id: string }[], context: RefinementCtx): void {
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
const nonEmptyEmittersSchema = tuple([emitterConfigSchema], emitterConfigSchema);

/** Only implemented configuration features are accepted. */
export const effectConfigSchema = strictObject({
  version: literal(1),
  modifiers: modifiersSchema.default([]),
  emitters: nonEmptyEmittersSchema.superRefine(validateUniqueEmitterIds),
});
