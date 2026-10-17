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
  rate: scalarPropertySchema.refine(
    (value) => typeof value !== 'number' || value >= 0,
    'Constant emission rate must be nonnegative',
  ),
  shape: shapeSchema,
});

const initialPropertiesSchema = strictObject({
  red: number().default(1),
  redSpread: number().nonnegative().default(0),
  greenSpread: number().nonnegative().default(0),
  blueSpread: number().nonnegative().default(0),
  alphaSpread: number().nonnegative().default(0),

  green: number().default(1),
  blue: number().default(1),
  alpha: number().default(1),
  rotation: number().default(0),
  rotationSpread: number().nonnegative().default(0),
  sizeSpread: number().nonnegative().default(0),
  size: number().nonnegative().default(24),
  lifetime: number().positive(),
  lifetimeSpread: number().nonnegative().default(0),
  speedSpread: number().nonnegative().default(0),
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
    .extend({
      lifetimeSpread: number().nonnegative(),
      speedSpread: number().nonnegative(),
      rotation: number(),
      rotationSpread: number().nonnegative(),
      sizeSpread: number().nonnegative(),
      size: number().nonnegative(),
      alpha: number(),
      red: number(),
      redSpread: number().nonnegative(),
      greenSpread: number().nonnegative(),
      blueSpread: number().nonnegative(),
      alphaSpread: number().nonnegative(),

      green: number(),
      blue: number(),
    })
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
  orientation: enumSchema(['default', 'initial-direction', 'movement-direction']).default(
    'default',
  ),
  playMode: enumSchema(['once', 'loop']).default('loop'),
  emission: emissionSchema,
  initial: initialPropertiesSchema,
  modifiers: modifiersSchema,
  overLifetime: strictObject({
    rotation: scalarPropertySchema.default(0),
    scale: scalarPropertySchema.default(1),
    alpha: scalarPropertySchema.default(1),
    red: scalarPropertySchema.default(1),
    green: scalarPropertySchema.default(1),
    blue: scalarPropertySchema.default(1),
  }).default({ scale: 1, alpha: 1, red: 1, green: 1, blue: 1, rotation: 0 }),
});

/** Only implemented configuration features are accepted. */
export const effectConfigSchema = strictObject({
  version: literal(1),
  emitters: tuple([emitterConfigSchema]),
});
