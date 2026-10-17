import {
  strictObject,
  number,
  int,
  string,
  literal,
  tuple,
  discriminatedUnion,
  enum as enumSchema,
} from 'zod';

import { scalarPropertySchema } from './curve';

const shapeSchema = discriminatedUnion('type', [
  strictObject({ type: literal('point') }),
  strictObject({ type: literal('circle'), diameter: number().nonnegative() }),
  strictObject({
    type: literal('box'),
    width: number().nonnegative(),
    height: number().nonnegative(),
  }),
  strictObject({
    type: literal('cone2d'),
    width: number().nonnegative(),
    height: number().nonnegative(),
  }),
]);

const emissionSchema = strictObject({
  rate: number().nonnegative(),
  shape: shapeSchema,
});

const initialPropertiesSchema = strictObject({
  size: number().nonnegative().default(24),
  lifetime: number().positive(),
  speed: number().nonnegative(),
  direction: number(),
  spread: number().nonnegative(),
});

const gravitySchema = strictObject({ x: literal(0), y: number() });
const modifiersSchema = strictObject({ gravity: gravitySchema });

/** Numeric updates only; shape type, identity, capacity and seed require recreation. */
export const emitterParametersSchema = strictObject({
  emission: strictObject({
    rate: number().nonnegative(),
    shape: strictObject({
      diameter: number().nonnegative(),
      width: number().nonnegative(),
      height: number().nonnegative(),
    }).partial(),
  })
    .partial()
    .optional(),
  initial: initialPropertiesSchema
    .extend({ size: number().nonnegative() })
    .partial()
    .refine(
      (patch) => Object.values(patch).every((value) => value !== undefined),
      'Initial parameter values must be numbers',
    )
    .optional(),
  modifiers: strictObject({ gravity: gravitySchema.partial().optional() }).optional(),
});

export const emitterConfigSchema = strictObject({
  id: string().refine((value) => value.trim().length > 0, 'Expected a nonempty identifier'),
  capacity: int().min(1).max(1_000_000),
  seed: int().min(0).max(65535),
  startOffset: number().nonnegative().default(0),
  startDelay: number().nonnegative().default(0),
  duration: number().nonnegative().default(1),
  playMode: enumSchema(['once', 'loop']).default('loop'),
  emission: emissionSchema,
  initial: initialPropertiesSchema,
  modifiers: modifiersSchema,
  overLifetime: strictObject({ scale: scalarPropertySchema.default(1) }).default({ scale: 1 }),
});

/** Only implemented configuration features are accepted. */
export const effectConfigSchema = strictObject({
  version: literal(1),
  emitters: tuple([emitterConfigSchema]),
});
