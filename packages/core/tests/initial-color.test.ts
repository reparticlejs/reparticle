import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';
import { SampledCurve } from '#src/curves/sampled-curve.js';

import skeleton from '../../../docs/effect.example.json';

const curve = {
  points: [
    { time: 0, value: -2, tangent: 4 },
    { time: 1, value: 2, tangent: 4 },
  ],
};

it.each(['red', 'green', 'blue', 'alpha'] as const)(
  'accepts signed %s curves and preserves them across unrelated patches',
  (channel) => {
    const source = skeleton.emitters[0]!;
    const config = parseEffectConfig({
      version: 1,
      emitters: [{ ...source, initial: { ...source.initial, [channel]: curve } }],
    }).emitters[0];
    expect(applyEmitterPatch(config, { initial: { size: 40 } }).initial[channel]).toEqual(curve);
    expect(applyEmitterPatch(config, { initial: { [channel]: 0.25 } }).initial[channel]).toBe(0.25);
    expect(() => applyEmitterPatch(config, { initial: { [channel]: curve } })).toThrow(ZodError);
    expect(() =>
      parseEffectConfig({
        version: 1,
        emitters: [{ ...source, initial: { ...source.initial, [channel]: { points: [] } } }],
      }),
    ).toThrow(ZodError);
    const sampled = new SampledCurve(config.initial[channel]);
    expect(sampled.at(0)).toBe(-2);
    expect(sampled.at(0.5)).toBe(0);
    expect(sampled.at(1)).toBe(2);
  },
);
