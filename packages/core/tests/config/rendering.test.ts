import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { mergeEmitterParameters } from '#src/config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';

import skeleton from '../../../../docs/effect.example.json';

function definition(rendering?: unknown) {
  return { version: 1, emitters: [{ ...skeleton.emitters[0]!, rendering }] };
}

it('validates shared rendering data and preserves it through simulation patches', () => {
  const rendering = { blendMode: 'add', tint: { red: 1, green: 0.5, blue: 0, alpha: 1 } };
  const config = parseEffectConfig(definition(rendering)).emitters[0];
  expect(config.rendering).toEqual(rendering);
  expect(mergeEmitterParameters(config, { initial: { size: 10 } }).rendering).toEqual(rendering);
  expect(parseEffectConfig(JSON.parse(JSON.stringify(definition(rendering))))).toEqual(
    parseEffectConfig(definition(rendering)),
  );
});

it('defaults omitted rendering to normal blending', () => {
  expect(parseEffectConfig(definition()).emitters[0].rendering).toEqual({
    blendMode: 'normal',
  });
});

it.each([
  { arbitrary: true },
  { texture: { rendererResource: true } },
  { texture: '' },
  { texture: 'smoke', atlas: 'particles', frame: 'smoke' },
  { atlas: 'particles' },
  { atlas: 'particles', frame: 'smoke', animation: 'smoke' },
  { atlas: 'particles', animation: 'smoke', fps: -1 },
  { atlas: 'particles', animation: 'smoke', playback: 'invalid' },
  { blendMode: 'alpha' },
  { flipX: 1 },
  { tint: { red: 1, green: 1, blue: 1, alpha: Infinity } },
  { pivot: { x: 0, y: 0, z: 0 } },
  null,
])('rejects invalid or renderer-specific rendering data: %j', (rendering) => {
  expect(() => parseEffectConfig(definition(rendering))).toThrow(ZodError);
});

it('accepts every shared blend mode', () => {
  for (const blendMode of ['normal', 'add', 'multiply', 'screen']) {
    expect(parseEffectConfig(definition({ blendMode })).emitters[0].rendering).toEqual({
      blendMode,
    });
  }
});

it('rejects blend mode as a simulation field or runtime simulation patch', () => {
  const config = parseEffectConfig(skeleton).emitters[0];
  expect(() =>
    parseEffectConfig({ version: 1, emitters: [{ ...config, blendMode: 'add' }] }),
  ).toThrow(ZodError);
  expect(() => mergeEmitterParameters(config, { blendMode: 'add' })).toThrow(ZodError);
});
