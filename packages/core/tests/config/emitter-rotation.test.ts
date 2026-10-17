import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults emitter rotation to zero and updates it independently of particle rotation', () => {
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...skeleton.emitters[0], rotation: undefined }],
  }).emitters[0];
  expect(config.rotation).toBe(0);
  for (const rotation of [-360, -90, 0, 90, 720]) {
    const updated = updateEmitterConfig(config, { rotation });
    expect(updated.rotation).toBe(rotation);
    expect(updated.initial.rotation).toEqual(config.initial.rotation);
  }
  for (const rotation of [NaN, Infinity, '90', null]) {
    expect(() => updateEmitterConfig(config, { rotation })).toThrow(ZodError);
  }
});
