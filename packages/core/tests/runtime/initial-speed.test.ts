import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';
import { SampledCurve } from '#src/curves/sampled-curve.js';
import { EmitterPlayback } from '#src/runtime/playback/emitter.js';

import skeleton from '../../../../docs/effect.example.json';

const speed = {
  points: [
    { time: 0, value: 100, tangent: -200 },
    { time: 1, value: -100, tangent: -200 },
  ],
};

it('samples signed initial speed using emitter timing, including loop boundaries', () => {
  const curve = new SampledCurve(speed);
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

it('accepts speed curves, preserves them on unrelated edits, and allows numeric replacement', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...source, initial: { ...source.initial, speed } }],
  }).emitters[0];
  expect(applyEmitterPatch(config, { initial: { speedSpread: 20 } }).initial.speed).toEqual(speed);
  expect(applyEmitterPatch(config, { initial: { speed: -30 } }).initial.speed).toBe(-30);
  expect(() => applyEmitterPatch(config, { initial: { speed } })).toThrow(ZodError);
  expect(() =>
    parseEffectConfig({
      version: 1,
      emitters: [{ ...source, initial: { ...source.initial, speed: { points: [] } } }],
    }),
  ).toThrow(ZodError);
});
