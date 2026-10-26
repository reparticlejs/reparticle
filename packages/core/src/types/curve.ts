import type { z } from 'zod/mini';

import type { curveSchema, scalarPropertySchema } from '#config/schemas/definition/curve.js';

/**
 * Parsed scalar curve with at least one point and strictly increasing times.
 * Point times lie in [0, 1], but points at both endpoints are not required.
 *
 * Adjacent points use cubic Hermite interpolation. A single point describes a
 * line with that point's tangent. This is authored curve data, not the float32
 * samples used during playback; boundary handling belongs to the evaluator.
 * @interface
 */
export type Curve = z.infer<typeof curveSchema>;

/**
 * Parsed curve point: time is normalized lifetime, value uses the property's
 * units, and tangent is the slope (change in value per unit of normalized time).
 * The same tangent applies on both sides of the point; it defaults to zero when
 * omitted from JSON and is always present after parsing.
 * @interface
 */
export type CurvePoint = Curve['points'][number];

/**
 * Constant scalar or parsed curve. A number keeps the same value at every time.
 * The owning property determines units, whether time follows the emitter or a
 * particle, and whether the evaluated value is an absolute value or a multiplier.
 */
export type ScalarProperty = z.infer<typeof scalarPropertySchema>;
