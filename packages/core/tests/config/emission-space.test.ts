import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults to world and accepts both spaces with inheritance preserved', () => {
  for (const space of [undefined, 'world', 'local']) {
    const source = { ...skeleton.emitters[0]!, space, inheritVelocity: 1 };
    const config = parseEffectConfig({ version: 1, emitters: [source] }).emitters[0];
    expect(config.space).toBe(space ?? 'world');
    expect(applyEmitterPatch(config, { inheritVelocity: 0.5 }).space).toBe(config.space);
    expect(() => applyEmitterPatch(config, { space: 'local' })).toThrow(ZodError);
  }
});

it.each(['emitter', '', 1, null])('rejects invalid space %s', (space) => {
  expect(() =>
    parseEffectConfig({ version: 1, emitters: [{ ...skeleton.emitters[0], space }] }),
  ).toThrow(ZodError);
});
