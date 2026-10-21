import { boolean, enum as enumSchema, int, number, strictObject, string } from 'zod';

import { emissionSchema } from './emission';
import { initialPropertiesSchema } from './initial-properties';
import { modifiersSchema } from './modifiers';
import { overLifetimeSchema } from './over-lifetime';

export const blendModeSchema = enumSchema(['normal', 'add', 'multiply', 'screen']);

const emitterIdSchema = string().refine(
  (id) => id.trim().length > 0,
  'Expected a nonempty identifier',
);

const positionSchema = strictObject({
  x: number().default(0),
  y: number().default(0),
});

const playModeSchema = enumSchema(['once', 'loop']);
const emissionSpaceSchema = enumSchema(['world', 'local']);
const orientationSchema = enumSchema([
  'default',
  'initial-direction',
  'movement-direction',
  'angular-velocity',
]);

export const emitterConfigSchema = strictObject({
  // Identity and allocation
  id: emitterIdSchema,
  capacity: int().min(1).max(1_000_000),
  seed: int().min(0).max(65535),

  // Playback
  playMode: playModeSchema.default('loop'),
  startDelay: number().nonnegative().default(0),
  startDelaySpread: number().nonnegative().default(0),
  duration: number().nonnegative().default(1),
  durationSpread: number().nonnegative().default(0),
  startOffset: number().nonnegative().default(0),

  // Emitter transform and particle space
  position: positionSchema.default({ x: 0, y: 0 }),
  rotation: number().default(0),
  scale: number().default(1),
  space: emissionSpaceSchema.default('world'),
  inheritVelocity: number().default(0),

  // Particle appearance
  orientation: orientationSchema.default('default'),
  stretchWithVelocity: boolean().default(false),
  blendMode: blendModeSchema.default('normal'),

  // Emission and particle behavior
  emission: emissionSchema,
  initial: initialPropertiesSchema,
  overLifetime: overLifetimeSchema,
  modifiers: modifiersSchema.default([]),
});
