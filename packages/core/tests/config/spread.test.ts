import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#config/parse-effect.js';
import skeleton from '#effect-example';

it('defaults property spreads to zero and updates them independently', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        initial: { ...source.initial, speedSpread: undefined, lifetimeSpread: undefined },
      },
    ],
  }).emitters[0];
  expect(config.initial.speedSpread).toBe(0);
  expect(config.initial.lifetimeSpread).toBe(0);
  const changed = mergeEmitterParameters(config, {
    initial: { speedSpread: 300, lifetimeSpread: 3 },
  });
  expect(changed.initial.speedSpread).toBe(300);
  expect(mergeEmitterParameters(changed, { initial: { lifetime: 1 } }).initial.lifetimeSpread).toBe(
    3,
  );
  for (const value of [-1, Infinity, NaN, undefined]) {
    expect(() => mergeEmitterParameters(config, { initial: { speedSpread: value } })).toThrow(
      ZodError,
    );
    expect(() => mergeEmitterParameters(config, { initial: { lifetimeSpread: value } })).toThrow(
      ZodError,
    );
  }
});

it('defaults size and rotation spreads and preserves independent numeric updates', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        initial: { ...source.initial, sizeSpread: undefined, rotationSpread: undefined },
      },
    ],
  }).emitters[0];
  expect(config.initial.sizeSpread).toBe(0);
  expect(config.initial.rotationSpread).toBe(0);
  const changed = mergeEmitterParameters(config, {
    initial: { sizeSpread: 40, rotationSpread: 720 },
  });
  expect(
    mergeEmitterParameters(changed, { initial: { size: 10, rotation: -90 } }).initial,
  ).toMatchObject({ sizeSpread: 40, rotationSpread: 720 });
  for (const value of [-1, Infinity, NaN, undefined]) {
    expect(() => mergeEmitterParameters(config, { initial: { sizeSpread: value } })).toThrow(
      ZodError,
    );
    expect(() => mergeEmitterParameters(config, { initial: { rotationSpread: value } })).toThrow(
      ZodError,
    );
  }
});

it('defaults RGBA spreads, accepts absolute half-ranges, and rejects invalid patches', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        initial: {
          ...source.initial,
          redSpread: undefined,
          greenSpread: undefined,
          blueSpread: undefined,
          alphaSpread: undefined,
        },
      },
    ],
  }).emitters[0];
  const spreads = ['redSpread', 'greenSpread', 'blueSpread', 'alphaSpread'] as const;
  for (const key of spreads) {
    expect(config.initial[key]).toBe(0);
    const changed = mergeEmitterParameters(config, { initial: { [key]: 2 } });
    expect(mergeEmitterParameters(changed, { initial: { red: 0.5 } }).initial[key]).toBe(2);
    for (const value of [-1, Infinity, NaN, undefined]) {
      expect(() => mergeEmitterParameters(config, { initial: { [key]: value } })).toThrow(ZodError);
    }
  }
});
