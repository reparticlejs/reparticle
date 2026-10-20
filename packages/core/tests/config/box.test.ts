import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/parse-effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

function box(width: unknown, height: unknown) {
  const emitter = skeleton.emitters[0]!;
  return {
    ...skeleton,
    emitters: [
      { ...emitter, emission: { ...emitter.emission, shape: { type: 'box', width, height } } },
    ],
  };
}

it.each([
  [200, 100],
  [0, 100],
  [100, 0],
  [0, 0],
])('accepts box dimensions %s × %s', (width, height) => {
  const original = parseEffectConfig(box(width, height)).emitters[0];
  const updated = updateEmitterConfig(original, { emission: { shape: { width: 300 } } });
  expect(updated.emission.shape).toEqual({
    widthSpread: 0,
    heightSpread: 0,
    type: 'box',
    width: 300,
    height,
  });
  expect(original.emission.shape).toEqual({
    widthSpread: 0,
    heightSpread: 0,
    type: 'box',
    width,
    height,
  });
});

it.each([Infinity, NaN, '100', undefined])('rejects invalid box dimensions %s', (value) => {
  expect(() => parseEffectConfig(box(value, 100))).toThrow(ZodError);
  expect(() => parseEffectConfig(box(100, value))).toThrow(ZodError);
});

it('rejects shape-inappropriate numeric updates', () => {
  const current = parseEffectConfig(box(200, 100)).emitters[0];
  expect(() => updateEmitterConfig(current, { emission: { shape: { diameter: 100 } } })).toThrow(
    ZodError,
  );
  const point = parseEffectConfig(skeleton).emitters[0];
  expect(() => updateEmitterConfig(point, { emission: { shape: { width: 100 } } })).toThrow(
    ZodError,
  );
});
