import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#config/parse-effect.js';
import { SampledCurve } from '#curves/sampled-curve.js';

import skeleton from '../../../docs/effect.example.json';

it('finds the maximum across sampled Hermite overshoot for prewarm', () => {
  const curve = new SampledCurve({
    points: [
      { time: 0, value: 1, tangent: 8 },
      { time: 1, value: 1, tangent: -8 },
    ],
  });
  expect(curve.maximum).toBe(3);
  expect(curve.at(0.5)).toBe(3);
  expect(new SampledCurve(-1).maximum).toBe(-1);
});

it('preserves lifetime curves and accepts nonpositive numeric lifetimes', () => {
  const source = skeleton.emitters[0]!;
  const lifetime = {
    points: [
      { time: 0, value: 0, tangent: 2 },
      { time: 1, value: 2, tangent: 2 },
    ],
  };
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...source, initial: { ...source.initial, lifetime } }],
  }).emitters[0];
  expect(
    mergeEmitterParameters(config, { initial: { lifetimeSpread: 0.5 } }).initial.lifetime,
  ).toEqual(lifetime);
  expect(mergeEmitterParameters(config, { initial: { lifetime: 0 } }).initial.lifetime).toBe(0);
  expect(mergeEmitterParameters(config, { initial: { lifetime: -1 } }).initial.lifetime).toBe(-1);
  expect(() => mergeEmitterParameters(config, { initial: { lifetime } })).toThrow(ZodError);
});
