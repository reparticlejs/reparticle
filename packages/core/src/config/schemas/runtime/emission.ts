import { z } from 'zod/mini';

// Runtime patches change dimensions without changing the emitter's shape type.

const shapeSchema = z.partial(
  z.strictObject({
    diameter: z.number(),
    diameterSpread: z.number().check(z.minimum(0)),
    width: z.number(),
    widthSpread: z.number().check(z.minimum(0)),
    height: z.number(),
    heightSpread: z.number().check(z.minimum(0)),
  }),
);

export const emissionSchema = z.partial(
  z.strictObject({
    rate: z.number().check(z.minimum(0)),
    shape: shapeSchema,
  }),
);
