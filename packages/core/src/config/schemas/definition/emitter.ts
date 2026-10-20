import { boolean, enum as enumSchema, int, number, strictObject, string } from 'zod';

import { emissionSchema } from './emission';
import { initialPropertiesSchema } from './initial-properties';
import { modifiersSchema } from './modifiers';
import { overLifetimeSchema } from './over-lifetime';

export const blendModeSchema = enumSchema(['alpha', 'add', 'multiply', 'screen']);

export const emitterConfigSchema = strictObject({
  id: string().refine((value) => value.trim().length > 0, 'Expected a nonempty identifier'),
  capacity: int().min(1).max(1_000_000),
  seed: int().min(0).max(65535),
  startDelay: number().nonnegative().default(0),
  startDelaySpread: number().nonnegative().default(0),
  duration: number().nonnegative().default(1),
  durationSpread: number().nonnegative().default(0),
  startOffset: number().nonnegative().default(0),
  playMode: enumSchema(['once', 'loop']).default('loop'),

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
  orientation: enumSchema([
    'default',
    'initial-direction',
    'movement-direction',
    'angular-velocity',
  ]).default('default'),

  emission: emissionSchema,
  initial: initialPropertiesSchema,
  overLifetime: overLifetimeSchema,
  modifiers: modifiersSchema.default([]),
});
