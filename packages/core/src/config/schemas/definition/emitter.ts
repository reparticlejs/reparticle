import { z, _default as defaultValue } from 'zod/mini';

import { emissionSchema } from './emission';
import { initialPropertiesSchema } from './initial-properties';
import { modifiersSchema } from './modifiers';
import { overLifetimeSchema } from './over-lifetime';
import { renderingSchema } from './rendering';

const emitterIdSchema = z
  .string()
  .check(z.refine((id) => id.trim().length > 0, 'Expected a nonempty identifier'));

const positionSchema = z.strictObject({
  x: defaultValue(z.number(), 0),
  y: defaultValue(z.number(), 0),
});

const playModeSchema = z.enum(['once', 'loop']);

const emissionSpaceSchema = z.enum(['world', 'local']);

const orientationSchema = z.enum([
  'default',
  'initial-direction',
  'movement-direction',
  'angular-velocity',
]);

/** Zod Mini schema for one emitter, including defaults and strict field validation. */
export const emitterConfigSchema = z.strictObject({
  // Identity and allocation
  id: emitterIdSchema,
  capacity: z.int().check(z.minimum(1), z.maximum(1_000_000)),
  seed: z.int().check(z.minimum(0), z.maximum(65535)),

  // Playback
  playMode: defaultValue(playModeSchema, 'loop'),
  startDelay: defaultValue(z.number().check(z.minimum(0)), 0),
  startDelaySpread: defaultValue(z.number().check(z.minimum(0)), 0),
  duration: defaultValue(z.number().check(z.minimum(0)), 1),
  durationSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  startOffset: defaultValue(z.number().check(z.minimum(0)), 0),

  // Emitter transform and particle space
  position: defaultValue(positionSchema, { x: 0, y: 0 }),
  rotation: defaultValue(z.number(), 0),
  scale: defaultValue(z.number(), 1),
  space: defaultValue(emissionSpaceSchema, 'world'),
  inheritVelocity: defaultValue(z.number(), 0),

  // Particle appearance
  orientation: defaultValue(orientationSchema, 'default'),
  stretchWithVelocity: defaultValue(z.boolean(), false),

  // Emission and particle behavior
  emission: emissionSchema,
  initial: initialPropertiesSchema,
  overLifetime: overLifetimeSchema,
  modifiers: defaultValue(modifiersSchema, []),

  // Rendering
  rendering: renderingSchema,
});
