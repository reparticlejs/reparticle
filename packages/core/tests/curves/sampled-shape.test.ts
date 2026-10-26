import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#src/config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';
import { SampledShape } from '#src/curves/sampled-shape.js';

import skeleton from '../../../../docs/effect.example.json';

const curve = {
  points: [
    { time: 0, value: -100, tangent: 200 },
    { time: 1, value: 100, tangent: 200 },
  ],
};

it.each(['circle', 'box', 'cone2d'])(
  'samples signed %s dimensions and retains curves on numeric updates',
  (type) => {
    const shape =
      type === 'circle'
        ? { type, diameter: curve, diameterSpread: 50 }
        : { type, width: curve, height: 80, widthSpread: 50, heightSpread: 20 };
    const source = skeleton.emitters[0]!;
    const config = parseEffectConfig({
      version: 1,
      emitters: [{ ...source, emission: { ...source.emission, shape } }],
    }).emitters[0];
    const sampled = new SampledShape(config.emission.shape);
    expect(sampled.dimensionX.at(0.25)).toBe(-50);
    expect(sampled.dimensionX.at(0.75)).toBe(50);
    expect(sampled.dimensionSpreadX).toBe(50);
    expect(sampled.dimensionY.at(0.5)).toBe(type === 'circle' ? 0 : 80);
    expect(sampled.dimensionSpreadY).toBe(type === 'circle' ? 0 : 20);
    const patch = type === 'circle' ? { diameterSpread: 10 } : { widthSpread: 10 };
    const updated = mergeEmitterParameters(config, { emission: { shape: patch } });
    expect(new SampledShape(updated.emission.shape).dimensionX.at(0.25)).toBe(-50);
    expect(new SampledShape(updated.emission.shape).dimensionSpreadX).toBe(10);
    expect(() =>
      mergeEmitterParameters(config, {
        emission: { shape: type === 'circle' ? { diameter: curve } : { width: curve } },
      }),
    ).toThrow(ZodError);
    expect(() =>
      mergeEmitterParameters(config, {
        emission: { shape: type === 'circle' ? { diameterSpread: -1 } : { widthSpread: -1 } },
      }),
    ).toThrow(ZodError);
  },
);
