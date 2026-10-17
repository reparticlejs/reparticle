import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

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

it.each([{ duration: 2 }, { playMode: 'once' }, { startDelay: 1 }])(
  'rejects structural playback updates: %j',
  (patch) => {
    const original = parseEffectConfig(effect(1, 'loop')).emitters[0];
    expect(() => updateEmitterConfig(original, patch)).toThrow(ZodError);
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
