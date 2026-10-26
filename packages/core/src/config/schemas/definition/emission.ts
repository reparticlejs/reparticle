import { z, _default as defaultValue } from 'zod/mini';

import { scalarPropertySchema } from './curve';

const pointShapeSchema = z.strictObject({
  type: z.literal('point'),
});

const circleShapeSchema = z.strictObject({
  type: z.literal('circle'),
  diameter: scalarPropertySchema,
  diameterSpread: defaultValue(z.number().check(z.minimum(0)), 0),
});

const boxShapeSchema = z.strictObject({
  type: z.literal('box'),
  width: scalarPropertySchema,
  widthSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  height: scalarPropertySchema,
  heightSpread: defaultValue(z.number().check(z.minimum(0)), 0),
});

const coneShapeSchema = z.strictObject({
  type: z.literal('cone2d'),
  width: scalarPropertySchema,
  widthSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  height: scalarPropertySchema,
  heightSpread: defaultValue(z.number().check(z.minimum(0)), 0),
});

const emissionShapeSchema = z.discriminatedUnion('type', [
  pointShapeSchema,
  circleShapeSchema,
  boxShapeSchema,
  coneShapeSchema,
]);
// Constant rates cannot be negative; curves are evaluated during playback.

const emissionRateSchema = scalarPropertySchema.check(
  z.refine(
    (rate) => typeof rate !== 'number' || rate >= 0,
    'Constant emission rate must be nonnegative',
  ),
);

export const emissionSchema = z.strictObject({
  rate: emissionRateSchema,
  rateSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  shape: emissionShapeSchema,
});
