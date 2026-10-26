import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#config/parse-effect.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults emitter rotation to zero and updates it independently of particle rotation', () => {
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...skeleton.emitters[0], rotation: undefined }],
  }).emitters[0];
  expect(config.rotation).toBe(0);
  for (const rotation of [-360, -90, 0, 90, 720]) {
    const updated = mergeEmitterParameters(config, { rotation });
    expect(updated.rotation).toBe(rotation);
    expect(updated.initial.rotation).toEqual(config.initial.rotation);
  }
  for (const rotation of [NaN, Infinity, '90', null]) {
    expect(() => mergeEmitterParameters(config, { rotation })).toThrow(ZodError);
  }
});
