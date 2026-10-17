import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('merges only supplied parameters and leaves the original definition independent', () => {
  const current = parseEffectConfig(skeleton).emitters[0];
  const next = updateEmitterConfig(current, {
    emission: { rate: 123 },
    initial: { speed: 50 },
    modifiers: { gravity: { y: -20 } },
  });
  expect(next.emission).toEqual({ rate: 123, shape: { type: 'point' } });
  expect(next.initial).toEqual({ ...current.initial, speed: 50 });
  expect(next.modifiers.gravity).toEqual({ x: 0, y: -20 });
  next.initial.direction = 0;
  expect(current).toEqual(skeleton.emitters[0]);
});

it.each([
  { capacity: 42 },
  { seed: 42 },
  { id: 'other' },
  { emission: { shape: { type: 'point' } } },
  { emission: { rate: 100 }, initial: { lifetime: 0 } },
  { modifiers: { gravity: { x: 1 } } },
  { initial: { speed: undefined } },
  { initial: { size: undefined } },
  { initial: { speed: NaN } },
])('rejects structural, unsupported or invalid updates atomically: %j', (patch) => {
  const current = parseEffectConfig(skeleton).emitters[0];
  expect(() => updateEmitterConfig(current, patch)).toThrow(ZodError);
  expect(current).toEqual(skeleton.emitters[0]);
});
