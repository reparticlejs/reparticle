import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#config/parse-effect.js';
import skeleton from '#effect-example';

it('defaults emitter scale to one and updates it independently of particle size', () => {
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...skeleton.emitters[0], scale: undefined }],
  }).emitters[0];
  expect(config.scale).toBe(1);
  for (const scale of [-2, 0, 0.5, 1, 3]) {
    const updated = mergeEmitterParameters(config, { scale });
    expect(updated.scale).toBe(scale);
    expect(updated.initial.size).toEqual(config.initial.size);
  }
  for (const scale of [NaN, Infinity, '2', null]) {
    expect(() => mergeEmitterParameters(config, { scale })).toThrow(ZodError);
  }
});
