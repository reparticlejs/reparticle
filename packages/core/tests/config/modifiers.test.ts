import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#config/parse-effect.js';
import { modifierSchema } from '#config/schemas/definition/modifiers.js';
import skeleton from '#effect-example';

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
  const next = mergeEmitterParameters(current, {
    modifiers: [
      { type: 'radial', magnitude: curve },
      { type: 'radial', magnitude: -10 },
    ],
  });
  expect(next.modifiers).toHaveLength(2);
  expect(next.modifiers[0]!.magnitude).toEqual(curve);
  expect(next.modifiers[1]!.magnitude).toBe(-10);
  expect(mergeEmitterParameters(next, { initial: { speed: 0 } }).modifiers).toEqual(next.modifiers);
  expect(mergeEmitterParameters(next, { modifiers: [] }).modifiers).toEqual([]);
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
  expect(() => mergeEmitterParameters(current, { modifiers })).toThrow(ZodError);
  expect(current).toEqual(skeleton.emitters[0]);
});

it('validates noise defaults and rejects invalid field settings', () => {
  expect(modifierSchema.parse({ type: 'noise' })).toEqual({
    type: 'noise',
    magnitude: 0,
    spread: 0,
    scale: 100,
    speed: 0.2,
    seed: 0,
  });
  for (const invalid of [
    { scale: 0 },
    { scale: -1 },
    { speed: Infinity },
    { seed: -1 },
    { seed: 0.5 },
    { seed: 65536 },
  ]) {
    expect(modifierSchema.safeParse({ type: 'noise', ...invalid }).success).toBe(false);
  }
  expect(modifierSchema.safeParse({ type: 'noise', speed: -1, seed: 65535 }).success).toBe(true);
});
