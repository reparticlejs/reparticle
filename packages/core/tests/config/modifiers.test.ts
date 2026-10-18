import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { modifierSchema } from '#src/config/schema.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('keeps repeated types and authored order in both scopes', () => {
  const modifiers = [
    { type: 'drag', magnitude: 2 },
    { type: 'acceleration', magnitude: 10 },
    { type: 'drag', magnitude: 3 },
  ];
  const effect = parseEffectConfig({
    ...skeleton,
    modifiers,
    emitters: [{ ...skeleton.emitters[0], modifiers }],
  });
  expect(effect.modifiers.map(({ type }) => type)).toEqual(['drag', 'acceleration', 'drag']);
  expect(effect.emitters[0].modifiers).toEqual(effect.modifiers);
  effect.modifiers[0]!.magnitude = 100;
  expect(effect.emitters[0].modifiers[0]!.magnitude).toBe(2);
});

it('defaults to an empty list and defaults individual modifier properties', () => {
  const effect = parseEffectConfig({
    version: 1,
    emitters: [{ ...skeleton.emitters[0], modifiers: undefined }],
  });
  expect(effect.modifiers).toEqual([]);
  expect(effect.emitters[0].modifiers).toEqual([]);
  expect(modifierSchema.parse({ type: 'acceleration' })).toEqual({
    type: 'acceleration',
    magnitude: 0,
    spread: 0,
    rotation: 0,
  });
  expect(modifierSchema.parse({ type: 'drag' })).toMatchObject({
    useDirection: false,
    rotation: 0,
  });
  expect(modifierSchema.parse({ type: 'radial' })).toMatchObject({ x: 0, y: 0, maxDistance: 100 });
  expect(modifierSchema.parse({ type: 'vortex' })).toMatchObject({
    x: 0,
    y: 0,
    maxDistance: 100,
    rotation: 0,
  });
});

it('replaces the complete list atomically, including order and curves', () => {
  const current = parseEffectConfig(skeleton).emitters[0];
  const curve = {
    points: [
      { time: 0, value: 0, tangent: 10 },
      { time: 1, value: 10, tangent: 10 },
    ],
  };
  const next = updateEmitterConfig(current, {
    modifiers: [
      { type: 'radial', magnitude: curve },
      { type: 'radial', magnitude: -10 },
    ],
  });
  expect(next.modifiers).toHaveLength(2);
  expect(next.modifiers[0]!.magnitude).toEqual(curve);
  expect(next.modifiers[1]!.magnitude).toBe(-10);
  expect(updateEmitterConfig(next, { initial: { speed: 0 } }).modifiers).toEqual(next.modifiers);
  expect(updateEmitterConfig(next, { modifiers: [] }).modifiers).toEqual([]);
  expect(current).toEqual(skeleton.emitters[0]);
});

it.each([
  {},
  null,
  [{ type: 'gravity' }],
  [{ type: 'drag', magnitude: Infinity }],
  [{ type: 'acceleration', spread: -1 }],
  [{ type: 'radial', maxDistance: -1 }],
  [{ type: 'vortex', x: NaN }],
  [{ type: 'drag', rotation: Infinity }],
  [{ type: 'drag', unknown: true }],
  Array.from({ length: 65 }, () => ({ type: 'drag' })),
])('rejects malformed or oversized lists in both scopes and runtime updates: %j', (modifiers) => {
  const current = parseEffectConfig(skeleton).emitters[0];
  expect(() => parseEffectConfig({ ...skeleton, modifiers })).toThrow(ZodError);
  expect(() => updateEmitterConfig(current, { modifiers })).toThrow(ZodError);
  expect(current).toEqual(skeleton.emitters[0]);
});
