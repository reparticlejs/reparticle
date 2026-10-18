import {
  strictObject,
  array,
  boolean,
  number,
  int,
  string,
  literal,
  tuple,
  discriminatedUnion,
  enum as enumSchema,
} from 'zod';

import { scalarPropertySchema } from './curve';

const blendModeSchema = enumSchema(['alpha', 'add', 'multiply', 'screen']);

const shapeSchema = discriminatedUnion('type', [
  strictObject({ type: literal('point') }),
  strictObject({
    type: literal('circle'),
    diameter: scalarPropertySchema,
    diameterSpread: number().nonnegative().default(0),
  }),
  strictObject({
    type: literal('box'),
    width: scalarPropertySchema,
    widthSpread: number().nonnegative().default(0),
    height: scalarPropertySchema,
    heightSpread: number().nonnegative().default(0),
  }),
  strictObject({
    type: literal('cone2d'),
    width: scalarPropertySchema,
    widthSpread: number().nonnegative().default(0),
    height: scalarPropertySchema,
    heightSpread: number().nonnegative().default(0),
  }),
]);

const emissionSchema = strictObject({
  rateSpread: number().nonnegative().default(0),
  rate: scalarPropertySchema.refine(
    (value) => typeof value !== 'number' || value >= 0,
    'Constant emission rate must be nonnegative',
  ),
  shape: shapeSchema,
});

const initialPropertiesSchema = strictObject({
  red: scalarPropertySchema.default(1),
  redSpread: number().nonnegative().default(0),
  greenSpread: number().nonnegative().default(0),
  blueSpread: number().nonnegative().default(0),
  alphaSpread: number().nonnegative().default(0),

  green: scalarPropertySchema.default(1),
  blue: scalarPropertySchema.default(1),
  alpha: scalarPropertySchema.default(1),
  stretchX: scalarPropertySchema.default(0),
  stretchY: scalarPropertySchema.default(0),
  stretchXSpread: number().nonnegative().default(0),
  stretchYSpread: number().nonnegative().default(0),
  angularVelocity: scalarPropertySchema.default(0),
  angularVelocitySpread: number().nonnegative().default(0),
  rotation: scalarPropertySchema.default(0),
  rotationSpread: number().nonnegative().default(0),
  sizeSpread: number().nonnegative().default(0),
  size: scalarPropertySchema.default(24),
  lifetime: scalarPropertySchema,
  lifetimeSpread: number().nonnegative().default(0),
  speedSpread: number().nonnegative().default(0),
  speed: scalarPropertySchema,
  direction: number(),
  spread: number().nonnegative(),
});

const accelerationSchema = strictObject({
  magnitude: scalarPropertySchema.default(0),
  spread: number().nonnegative().default(0),
  rotation: number().default(0),
});
const vortexSchema = strictObject({
  rotation: number().default(0),
  magnitude: scalarPropertySchema.default(0),
  spread: number().nonnegative().default(0),
  x: number().default(0),
  y: number().default(0),
  maxDistance: number().nonnegative().default(100),
});
const radialSchema = strictObject({
  magnitude: scalarPropertySchema.default(0),
  spread: number().nonnegative().default(0),
  x: number().default(0),
  y: number().default(0),
  maxDistance: number().nonnegative().default(100),
});
const dragSchema = strictObject({
  magnitude: scalarPropertySchema.default(0),
  spread: number().nonnegative().default(0),
  useDirection: boolean().default(false),
  rotation: number().default(0),
});
export const modifierSchema = discriminatedUnion('type', [
  accelerationSchema.extend({ type: literal('acceleration') }),
  dragSchema.extend({ type: literal('drag') }),
  radialSchema.extend({ type: literal('radial') }),
  vortexSchema.extend({ type: literal('vortex') }),
]);

/** Each scope permits 64 modifiers; the GPU applies at most 128 in one pass. */
export const modifiersSchema = array(modifierSchema).max(64);

/** Runtime values and flags; shape type, identity, capacity and seed require recreation. */
export const emitterParametersSchema = strictObject({
  blendMode: blendModeSchema.optional(),
  stretchWithVelocity: boolean().optional(),
  position: strictObject({ x: number().optional(), y: number().optional() }).optional(),
  scale: number().optional(),
  rotation: number().optional(),
  inheritVelocity: number().optional(),
  emission: strictObject({
    rate: number().nonnegative(),
    shape: strictObject({
      diameter: number(),
      diameterSpread: number().nonnegative(),
      width: number(),
      widthSpread: number().nonnegative(),
      height: number(),
      heightSpread: number().nonnegative(),
    }).partial(),
  })
    .partial()
    .optional(),
  initial: initialPropertiesSchema
    .extend({
      lifetimeSpread: number().nonnegative(),
      speedSpread: number().nonnegative(),
      speed: number(),
      lifetime: number(),
      stretchX: number(),
      stretchY: number(),
      stretchXSpread: number().nonnegative(),
      stretchYSpread: number().nonnegative(),
      angularVelocity: number(),
      angularVelocitySpread: number().nonnegative(),
      rotation: number(),
      rotationSpread: number().nonnegative(),
      sizeSpread: number().nonnegative(),
      size: number(),
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
  modifiers: modifiersSchema.optional(),
});

export const emitterConfigSchema = strictObject({
  blendMode: blendModeSchema.default('alpha'),
  stretchWithVelocity: boolean().default(false),
  position: strictObject({ x: number().default(0), y: number().default(0) }).default({
    x: 0,
    y: 0,
  }),
  scale: number().default(1),
  rotation: number().default(0),
  space: enumSchema(['world', 'local']).default('world'),
  inheritVelocity: number().default(0),
  id: string().refine((value) => value.trim().length > 0, 'Expected a nonempty identifier'),
  capacity: int().min(1).max(1_000_000),
  seed: int().min(0).max(65535),
  startOffset: number().nonnegative().default(0),
  startDelay: number().nonnegative().default(0),
  startDelaySpread: number().nonnegative().default(0),
  duration: number().nonnegative().default(1),
  durationSpread: number().nonnegative().default(0),
  orientation: enumSchema([
    'default',
    'initial-direction',
    'movement-direction',
    'angular-velocity',
  ]).default('default'),
  playMode: enumSchema(['once', 'loop']).default('loop'),
  emission: emissionSchema,
  initial: initialPropertiesSchema,
  modifiers: modifiersSchema.default([]),
  overLifetime: strictObject({
    stretchX: scalarPropertySchema.default(0),
    stretchY: scalarPropertySchema.default(0),
    angularVelocity: scalarPropertySchema.default(1),
    rotation: scalarPropertySchema.default(0),
    scale: scalarPropertySchema.default(1),
    alpha: scalarPropertySchema.default(1),
    red: scalarPropertySchema.default(1),
    green: scalarPropertySchema.default(1),
    blue: scalarPropertySchema.default(1),
  }).default({
    scale: 1,
    alpha: 1,
    red: 1,
    green: 1,
    blue: 1,
    rotation: 0,
    angularVelocity: 1,
    stretchX: 0,
    stretchY: 0,
  }),
});

/** Only implemented configuration features are accepted. */
export const effectConfigSchema = strictObject({
  version: literal(1),
  modifiers: modifiersSchema.default([]),
  emitters: tuple([emitterConfigSchema], emitterConfigSchema).superRefine((emitters, context) => {
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
  }),
});
