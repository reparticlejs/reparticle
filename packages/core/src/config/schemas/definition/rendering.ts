import { enum as enumSchema, number, strictObject } from 'zod';

const tintSchema = strictObject({
  red: number(),
  green: number(),
  blue: number(),
  alpha: number(),
});

/** Shared appearance settings. Artwork is supplied separately by the renderer. */
export const renderingSchema = strictObject({
  blendMode: enumSchema(['normal', 'add', 'multiply', 'screen']).default('normal'),
  tint: tintSchema.optional(),
}).prefault({});
