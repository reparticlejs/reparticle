import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#config/parse-effect.js';
import skeleton from '#effect-example';

it('supports angular orientation, birth speed curves, and lifetime multipliers', () => {
  const source = skeleton.emitters[0]!;
  const curve = {
    points: [
      { time: 0, value: -90, tangent: 180 },
      { time: 1, value: 90, tangent: 180 },
    ],
  };
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        orientation: 'angular-velocity',
        initial: { ...source.initial, angularVelocity: curve },
        overLifetime: { angularVelocity: curve },
      },
    ],
  }).emitters[0];
  expect(config.initial.angularVelocity).toEqual(curve);
  expect(config.overLifetime.angularVelocity).toEqual(curve);
  const changed = mergeEmitterParameters(config, { initial: { angularVelocitySpread: 45 } });
  expect(changed.initial.angularVelocity).toEqual(curve);
  expect(
    mergeEmitterParameters(changed, { initial: { angularVelocity: -180 } }).initial.angularVelocity,
  ).toBe(-180);
  for (const initial of [
    { angularVelocity: Infinity },
    { angularVelocitySpread: -1 },
    { angularVelocity: curve },
  ]) {
    expect(() => mergeEmitterParameters(config, { initial })).toThrow(ZodError);
  }
});
