import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';

import skeleton from '../../../../docs/effect.example.json';

function cone2d(width: unknown, height: unknown) {
  const emitter = skeleton.emitters[0]!;
  return {
    ...skeleton,
    emitters: [
      { ...emitter, emission: { ...emitter.emission, shape: { type: 'cone2d', width, height } } },
    ],
  };
}

it.each([
  [200, 100],
  [0, 100],
  [100, 0],
  [0, 0],
])('accepts cone2d dimensions %s × %s', (width, height) => {
  const original = parseEffectConfig(cone2d(width, height)).emitters[0];
  const updated = applyEmitterPatch(original, { emission: { shape: { width: 300 } } });
  expect(updated.emission.shape).toEqual({
    widthSpread: 0,
    heightSpread: 0,
    type: 'cone2d',
    width: 300,
    height,
  });
  expect(original.emission.shape).toEqual({
    widthSpread: 0,
    heightSpread: 0,
    type: 'cone2d',
    width,
    height,
  });
});

it.each([Infinity, NaN, '100', undefined])('rejects invalid cone2d dimensions %s', (value) => {
  expect(() => parseEffectConfig(cone2d(value, 100))).toThrow(ZodError);
  expect(() => parseEffectConfig(cone2d(100, value))).toThrow(ZodError);
});

it('rejects shape-inappropriate numeric updates', () => {
  const current = parseEffectConfig(cone2d(200, 100)).emitters[0];
  expect(() => applyEmitterPatch(current, { emission: { shape: { diameter: 100 } } })).toThrow(
    ZodError,
  );
  const point = parseEffectConfig(skeleton).emitters[0];
  expect(() => applyEmitterPatch(point, { emission: { shape: { width: 100 } } })).toThrow(ZodError);
});

it('rejects invalid dimension updates without changing the original cone', () => {
  const original = parseEffectConfig(cone2d(200, 100)).emitters[0];
  expect(() => applyEmitterPatch(original, { emission: { shape: { height: NaN } } })).toThrow(
    ZodError,
  );
  expect(original.emission.shape).toEqual({
    widthSpread: 0,
    heightSpread: 0,
    type: 'cone2d',
    width: 200,
    height: 100,
  });
});
