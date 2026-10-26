import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#src/config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';

import skeleton from '../../../../docs/effect.example.json';

function circle(diameter: unknown) {
  const emitter = skeleton.emitters[0]!;
  return {
    ...skeleton,
    emitters: [
      { ...emitter, emission: { ...emitter.emission, shape: { type: 'circle', diameter } } },
    ],
  };
}

it.each([0, 100])('accepts circle diameter %s and updates it without changing type', (diameter) => {
  const original = parseEffectConfig(circle(diameter)).emitters[0];
  const updated = mergeEmitterParameters(original, { emission: { shape: { diameter: 200 } } });
  expect(updated.emission.shape).toEqual({ diameterSpread: 0, type: 'circle', diameter: 200 });
  expect(original.emission.shape).toEqual({ diameterSpread: 0, type: 'circle', diameter });
});

it.each([Infinity, NaN, '100', undefined])('rejects invalid circle diameter %s', (diameter) => {
  expect(() => parseEffectConfig(circle(diameter))).toThrow(ZodError);
});

it('rejects diameter on point emitters and shape type changes through numeric updates', () => {
  const point = parseEffectConfig(skeleton).emitters[0];
  expect(() => mergeEmitterParameters(point, { emission: { shape: { diameter: 100 } } })).toThrow(
    ZodError,
  );
  const current = parseEffectConfig(circle(100)).emitters[0];
  const patch = { emission: { shape: { type: 'point' } } };
  expect(() => mergeEmitterParameters(current, patch)).toThrow(ZodError);
  expect(current.emission.shape).toEqual({ diameterSpread: 0, type: 'circle', diameter: 100 });
});
