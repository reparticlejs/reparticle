import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults RGB to white and lifetime multipliers to one', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        initial: { ...source.initial, red: undefined, green: undefined, blue: undefined },
        overLifetime: undefined,
      },
    ],
  }).emitters[0];
  expect([config.initial.red, config.initial.green, config.initial.blue]).toEqual([1, 1, 1]);
  expect(config.overLifetime).toEqual({ scale: 1, red: 1, green: 1, blue: 1, alpha: 1 });
});

it('supports independent constants and curves for each channel', () => {
  const source = skeleton.emitters[0]!;
  const red = {
    points: [
      { time: 0, value: 0, tangent: 1 },
      { time: 1, value: 1, tangent: 1 },
    ],
  };
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...source, overLifetime: { red, green: -1, blue: 2 } }],
  }).emitters[0];
  expect(config.overLifetime).toEqual({ red, green: -1, blue: 2, alpha: 1, scale: 1 });
});

it('updates birth channels independently without resetting unspecified values', () => {
  const original = parseEffectConfig(skeleton).emitters[0];
  const changed = updateEmitterConfig(original, { initial: { red: 0.25, green: -1, blue: 2 } });
  const next = updateEmitterConfig(changed, { initial: { alpha: 0.5 } });
  expect([next.initial.red, next.initial.green, next.initial.blue]).toEqual([0.25, -1, 2]);
  expect(original.initial.red).toBe(1);
  for (const channel of ['red', 'green', 'blue']) {
    for (const value of [undefined, NaN, Infinity, null, '1']) {
      expect(() => updateEmitterConfig(next, { initial: { [channel]: value } })).toThrow(ZodError);
    }
  }
  expect(() => updateEmitterConfig(next, { overLifetime: { red: 0 } })).toThrow(ZodError);
});
