import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults initial and lifetime alpha to one for existing definitions', () => {
  const original = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...original,
        initial: { ...original.initial, alpha: undefined },
        overLifetime: { scale: 1 },
      },
    ],
  }).emitters[0];
  expect(config.initial.alpha).toBe(1);
  expect(config.overLifetime.alpha).toBe(1);
});

it('accepts signed alpha factors so the product can be clamped after multiplication', () => {
  const config = parseEffectConfig(skeleton).emitters[0];
  expect(updateEmitterConfig(config, { initial: { alpha: -2 } }).initial.alpha).toBe(-2);
  expect(updateEmitterConfig(config, { initial: { alpha: 2 } }).initial.alpha).toBe(2);
});

it('keeps alpha on unrelated updates and rejects invalid patches atomically', () => {
  const config = parseEffectConfig(skeleton).emitters[0];
  const changed = updateEmitterConfig(config, { initial: { alpha: 0.25 } });
  expect(updateEmitterConfig(changed, { initial: { size: 50 } }).initial.alpha).toBe(0.25);
  for (const alpha of [NaN, Infinity, undefined, null, '0.5']) {
    expect(() => updateEmitterConfig(changed, { initial: { alpha } })).toThrow(ZodError);
  }
  expect(() => updateEmitterConfig(changed, { overLifetime: { alpha: 0 } })).toThrow(ZodError);
  expect(config.initial.alpha).toBe(1);
});

it('parses lifetime alpha using the shared curve contract', () => {
  const original = skeleton.emitters[0]!;
  const alpha = {
    points: [
      { time: 0, value: 1, tangent: -1 },
      { time: 1, value: 0, tangent: -1 },
    ],
  };
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...original, overLifetime: { alpha } }],
  }).emitters[0];
  expect(config.overLifetime).toEqual({ scale: 1, alpha });
});
