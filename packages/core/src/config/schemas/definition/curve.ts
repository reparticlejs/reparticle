import { z, _default as defaultValue } from 'zod/mini';

const pointSchema = z.strictObject({
  time: z.number().check(z.minimum(0), z.maximum(1)),
  value: z.number(),
  // Slope dy/dx of the curve at this point.
  tangent: defaultValue(z.number(), 0),
});

export const curveSchema = z.strictObject({
  points: z
    .array(pointSchema)
    .check(z.minLength(1))
    .check(
      z.refine(
        (points) =>
          points.every((point, index) => index === 0 || point.time > points[index - 1]!.time),
        'Curve points must have strictly increasing times',
      ),
    ),
});

export const scalarPropertySchema = z.union([z.number(), curveSchema]);
