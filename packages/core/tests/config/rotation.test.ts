import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';
import { sampleCurve } from '#src/curves/sample-curve.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults birth and lifetime rotation to zero', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      { ...source, initial: { ...source.initial, rotation: undefined }, overLifetime: undefined },
    ],
  }).emitters[0];
  expect(config.initial.rotation).toBe(0);
  expect(config.overLifetime.rotation).toBe(0);
});

it('accepts negative and multi-turn degree values without wrapping', () => {
  const source = skeleton.emitters[0]!;
  const rotation = {
    points: [
      { time: 0, value: -360, tangent: 1080 },
      { time: 1, value: 720, tangent: 1080 },
    ],
  };
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      { ...source, initial: { ...source.initial, rotation: -450 }, overLifetime: { rotation } },
    ],
  }).emitters[0];
  expect(config.initial.rotation).toBe(-450);
  const samples = sampleCurve(config.overLifetime.rotation);
  expect(samples[0]).toBe(-360);
  expect(samples[32]).toBe(180);
  expect(samples[64]).toBe(720);
});

it('updates initial rotation independently and rejects invalid or structural patches', () => {
  const original = parseEffectConfig(skeleton).emitters[0];
  const changed = updateEmitterConfig(original, { initial: { rotation: 90 } });
  expect(updateEmitterConfig(changed, { initial: { size: 40 } }).initial.rotation).toBe(90);
  expect(original.initial.rotation).toBe(0);
  for (const rotation of [undefined, NaN, Infinity, null, '90']) {
    expect(() => updateEmitterConfig(changed, { initial: { rotation } })).toThrow(ZodError);
  }
  expect(() => updateEmitterConfig(changed, { overLifetime: { rotation: 90 } })).toThrow(ZodError);
});

it('defaults orientation and accepts only supported structural modes', () => {
  const source = skeleton.emitters[0]!;
  const parse = (orientation: unknown) =>
    parseEffectConfig({ version: 1, emitters: [{ ...source, orientation }] }).emitters[0];
  expect(parse(undefined).orientation).toBe('default');
  expect(parse('initial-direction').orientation).toBe('initial-direction');
  expect(parse('movement-direction').orientation).toBe('movement-direction');
  expect(() => parse('unknown')).toThrow(ZodError);
  expect(() => updateEmitterConfig(parse('default'), { orientation: 'initial-direction' })).toThrow(
    ZodError,
  );
});
