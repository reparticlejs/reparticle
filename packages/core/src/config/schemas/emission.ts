import { discriminatedUnion, literal, number, strictObject } from 'zod';

import { scalarPropertySchema } from './curve';

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

export const emissionSchema = strictObject({
  rateSpread: number().nonnegative().default(0),
  rate: scalarPropertySchema.refine(
    (value) => typeof value !== 'number' || value >= 0,
    'Constant emission rate must be nonnegative',
  ),
  shape: shapeSchema,
});

export const emissionParametersSchema = strictObject({
  rate: number().nonnegative(),
  shape: strictObject({
    diameter: number(),
    diameterSpread: number().nonnegative(),
    width: number(),
    widthSpread: number().nonnegative(),
    height: number(),
    heightSpread: number().nonnegative(),
  }).partial(),
}).partial();
