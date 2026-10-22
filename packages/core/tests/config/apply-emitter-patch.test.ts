import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';

import skeleton from '../../../../docs/effect.example.json';

it('merges only supplied parameters and leaves the original definition independent', () => {
  const current = parseEffectConfig(skeleton).emitters[0];
  const next = applyEmitterPatch(current, {
    emission: { rate: 123 },
    initial: { speed: 50 },
    modifiers: [{ type: 'acceleration', magnitude: -20, rotation: 180 }],
  });
  expect(next.emission).toEqual({ rate: 123, rateSpread: 0, shape: { type: 'point' }, bursts: [] });
  expect(next.initial).toEqual({ ...current.initial, speed: 50 });
  expect(next.modifiers[0]).toEqual({
    type: 'acceleration',
    magnitude: -20,
    spread: 0,
    rotation: 180,
  });
  next.initial.direction = 0;
  expect(current).toEqual(skeleton.emitters[0]);
});

it.each([
  { capacity: 42 },
  { seed: 42 },
  { id: 'other' },
  { emission: { shape: { type: 'point' } } },
  { emission: { rate: 100 }, initial: { lifetime: NaN } },
  { modifiers: { gravity: { x: 1 } } },
  { initial: { speed: undefined } },
  { initial: { size: undefined } },
  { initial: { speed: NaN } },
])('rejects structural, unsupported or invalid updates atomically: %j', (patch) => {
  const current = parseEffectConfig(skeleton).emitters[0];
  expect(() => applyEmitterPatch(current, patch)).toThrow(ZodError);
  expect(current).toEqual(skeleton.emitters[0]);
});

it('merges position axes independently without mutating the authored origin', () => {
  const current = parseEffectConfig(skeleton).emitters[0];
  const placed = applyEmitterPatch(current, { position: { x: -25, y: 40 } });
  const moved = applyEmitterPatch(placed, { position: { x: 12 } });
  expect(moved.position).toEqual({ x: 12, y: 40 });
  expect(placed.position).toEqual({ x: -25, y: 40 });
  expect(current.position).toEqual({ x: 0, y: 0 });
});

it.each([{ x: NaN }, { y: Infinity }, { x: '12' }, { z: 1 }])(
  'rejects invalid position patches %j',
  (position) => {
    expect(() => applyEmitterPatch(parseEffectConfig(skeleton).emitters[0], { position })).toThrow(
      ZodError,
    );
  },
);
