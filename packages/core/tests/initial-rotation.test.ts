import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';
import { SampledCurve } from '#src/curves/sampled-curve.js';
import { EmitterPlayback } from '#src/emitter-playback.js';

import skeleton from '../../../docs/effect.example.json';

const rotation = {
  points: [
    { time: 0, value: 100, tangent: -200 },
    { time: 1, value: -100, tangent: -200 },
  ],
};

it('samples signed initial rotation using emitter timing, including loop boundaries', () => {
  const curve = new SampledCurve(rotation);
  expect(curve.at(0.25)).toBe(50);
  expect(curve.at(0.75)).toBe(-50);
  for (const mode of ['once', 'loop'] as const) {
    const clock = new EmitterPlayback(0.2, mode);
    clock.advance(0.1);
    expect(curve.at(clock.normalizedAge)).toBe(0);
    clock.advance(0.1);
    expect(curve.at(clock.normalizedAge)).toBe(mode === 'once' ? -100 : 100);
  }
  expect(() => new SampledCurve(1e100)).toThrow(RangeError);
});

it('accepts rotation curves, preserves them on unrelated edits, and allows numeric replacement', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...source, initial: { ...source.initial, rotation } }],
  }).emitters[0];
  expect(updateEmitterConfig(config, { initial: { rotationSpread: 20 } }).initial.rotation).toEqual(
    rotation,
  );
  expect(updateEmitterConfig(config, { initial: { rotation: -30 } }).initial.rotation).toBe(-30);
  expect(() => updateEmitterConfig(config, { initial: { rotation } })).toThrow(ZodError);
  expect(() =>
    parseEffectConfig({
      version: 1,
      emitters: [{ ...source, initial: { ...source.initial, rotation: { points: [] } } }],
    }),
  ).toThrow(ZodError);
});
