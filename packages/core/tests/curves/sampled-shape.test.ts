import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
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
    expect(sampled.x.at(0.25)).toBe(-50);
    expect(sampled.x.at(0.75)).toBe(50);
    expect(sampled.spreadX).toBe(50);
    expect(sampled.y.at(0.5)).toBe(type === 'circle' ? 0 : 80);
    expect(sampled.spreadY).toBe(type === 'circle' ? 0 : 20);
    const patch = type === 'circle' ? { diameterSpread: 10 } : { widthSpread: 10 };
    const updated = applyEmitterPatch(config, { emission: { shape: patch } });
    expect(new SampledShape(updated.emission.shape).x.at(0.25)).toBe(-50);
    expect(new SampledShape(updated.emission.shape).spreadX).toBe(10);
    expect(() =>
      applyEmitterPatch(config, {
        emission: { shape: type === 'circle' ? { diameter: curve } : { width: curve } },
      }),
    ).toThrow(ZodError);
    expect(() =>
      applyEmitterPatch(config, {
        emission: { shape: type === 'circle' ? { diameterSpread: -1 } : { widthSpread: -1 } },
      }),
    ).toThrow(ZodError);
  },
);
