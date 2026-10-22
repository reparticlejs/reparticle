import { discriminatedUnion, literal, number, strictObject } from 'zod';

import { scalarPropertySchema } from './curve';

const pointShapeSchema = strictObject({
  type: literal('point'),
});

const circleShapeSchema = strictObject({
  type: literal('circle'),
  diameter: scalarPropertySchema,
  diameterSpread: number().nonnegative().default(0),
});

const boxShapeSchema = strictObject({
  type: literal('box'),
  width: scalarPropertySchema,
  widthSpread: number().nonnegative().default(0),
  height: scalarPropertySchema,
  heightSpread: number().nonnegative().default(0),
});

const coneShapeSchema = strictObject({
  type: literal('cone2d'),
  width: scalarPropertySchema,
  widthSpread: number().nonnegative().default(0),
  height: scalarPropertySchema,
  heightSpread: number().nonnegative().default(0),
});

const emissionShapeSchema = discriminatedUnion('type', [
  pointShapeSchema,
  circleShapeSchema,
  boxShapeSchema,
  coneShapeSchema,
]);

// Constant rates cannot be negative; curves are evaluated during playback.
const emissionRateSchema = scalarPropertySchema.refine(
  (rate) => typeof rate !== 'number' || rate >= 0,
  'Constant emission rate must be nonnegative',
);

export const emissionSchema = strictObject({
  rate: emissionRateSchema,
  rateSpread: number().nonnegative().default(0),
  shape: emissionShapeSchema,
});
