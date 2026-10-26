import { z, _default as defaultValue } from 'zod/mini';

const tintSchema = z.strictObject({
  red: z.number(),
  green: z.number(),
  blue: z.number(),
  alpha: z.number(),
});

/** Zod Mini schema for shared appearance settings. Artwork is supplied separately by the renderer. */
export const renderingSchema = z.prefault(
  z.strictObject({
    blendMode: defaultValue(z.enum(['normal', 'add', 'multiply', 'screen']), 'normal'),
    tint: z.optional(tintSchema),
  }),
  {},
);
