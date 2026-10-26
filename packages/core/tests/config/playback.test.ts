import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';

import skeleton from '../../../../docs/effect.example.json';

function effect(duration: unknown, playMode: unknown) {
  return { ...skeleton, emitters: [{ ...skeleton.emitters[0], duration, playMode }] };
}

it.each(['once', 'loop'])('accepts %s playback with zero and positive durations', (playMode) => {
  for (const duration of [0, 0.01, 1, 10]) {
    const emitter = parseEffectConfig(effect(duration, playMode)).emitters[0];
    expect(emitter.duration).toBe(duration);
    expect(emitter.playMode).toBe(playMode);
  }
});

it('defaults omitted playback settings to a one-second loop', () => {
  const emitter = parseEffectConfig(effect(undefined, undefined)).emitters[0];
  expect(emitter.duration).toBe(1);
  expect(emitter.playMode).toBe('loop');
});

it.each([-1, NaN, Infinity, '1', null])('rejects invalid duration %s', (duration) => {
  expect(() => parseEffectConfig(effect(duration, 'once'))).toThrow(ZodError);
});

it.each(['repeat', 'Once', '', 1, null])('rejects invalid play mode %s', (playMode) => {
  expect(() => parseEffectConfig(effect(1, playMode))).toThrow(ZodError);
});

it.each([{ duration: 2 }, { playMode: 'once' }, { startDelay: 1 }, { startOffset: 1 }])(
  'rejects structural playback updates: %j',
  (patch) => {
    const original = parseEffectConfig(effect(1, 'loop')).emitters[0];
    expect(() => applyEmitterPatch(original, patch)).toThrow(ZodError);
    expect(original.duration).toBe(1);
    expect(original.playMode).toBe('loop');
  },
);

it.each([undefined, 0, 0.1, 5])('accepts start delay %s and defaults to zero', (startDelay) => {
  const input = effect(1, 'once');
  const emitter = parseEffectConfig({
    ...input,
    emitters: [{ ...input.emitters[0], startDelay }],
  }).emitters[0];
  expect(emitter.startDelay).toBe(startDelay ?? 0);
});

it.each([-1, NaN, Infinity, '1', null])('rejects invalid start delay %s', (startDelay) => {
  const input = effect(1, 'once');
  expect(() =>
    parseEffectConfig({
      ...input,
      emitters: [{ ...input.emitters[0], startDelay }],
    }),
  ).toThrow(ZodError);
});

it.each([undefined, 0, 0.1, 5])('accepts start offset %s and defaults to zero', (startOffset) => {
  const input = effect(1, 'once');
  const emitter = parseEffectConfig({
    ...input,
    emitters: [{ ...input.emitters[0], startOffset }],
  }).emitters[0];
  expect(emitter.startOffset).toBe(startOffset ?? 0);
});

it.each([-1, NaN, Infinity, '1', null])('rejects invalid start offset %s', (startOffset) => {
  const input = effect(1, 'once');
  expect(() =>
    parseEffectConfig({
      ...input,
      emitters: [{ ...input.emitters[0], startOffset }],
    }),
  ).toThrow(ZodError);
});

it.each(['durationSpread', 'startDelaySpread'])(
  'validates %s as nonnegative, defaulting to zero',
  (key) => {
    const input = effect(1, 'loop');
    expect(parseEffectConfig(input).emitters[0]).toHaveProperty(key, 0);
    for (const value of [0, 0.5, 10]) {
      expect(
        parseEffectConfig({ ...input, emitters: [{ ...input.emitters[0], [key]: value }] })
          .emitters[0],
      ).toHaveProperty(key, value);
    }
    for (const value of [-1, NaN, Infinity, '1', null]) {
      expect(() =>
        parseEffectConfig({ ...input, emitters: [{ ...input.emitters[0], [key]: value }] }),
      ).toThrow(ZodError);
    }
    expect(() => applyEmitterPatch(parseEffectConfig(input).emitters[0], { [key]: 1 })).toThrow(
      ZodError,
    );
  },
);
