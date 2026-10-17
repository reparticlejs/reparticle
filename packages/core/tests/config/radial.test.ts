import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults radial to disabled and preserves curves during numeric edits', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({ version: 1, emitters: [{ ...source, modifiers: {} }] })
    .emitters[0];
  expect(config.modifiers.radial).toEqual({
    magnitude: 0,
    spread: 0,
    x: 0,
    y: 0,
    maxDistance: 100,
  });
  const curve = {
    points: [
      { time: 0, value: -100, tangent: 200 },
      { time: 1, value: 100, tangent: 200 },
    ],
  };
  config.modifiers.radial.magnitude = curve;
  const updated = updateEmitterConfig(config, {
    modifiers: { radial: { x: 10, y: 20, spread: 30, maxDistance: 0 } },
  });
  expect(updated.modifiers.radial).toEqual({
    magnitude: curve,
    spread: 30,
    x: 10,
    y: 20,
    maxDistance: 0,
  });
  expect(
    updateEmitterConfig(updated, { modifiers: { radial: { magnitude: -200 } } }).modifiers.radial
      .magnitude,
  ).toBe(-200);
  expect(config.modifiers.radial.x).toBe(0);
  for (const patch of [
    { magnitude: curve },
    { maxDistance: -1 },
    { spread: -1 },
    { x: Infinity },
    { y: NaN },
  ]) {
    expect(() => updateEmitterConfig(config, { modifiers: { radial: patch } })).toThrow(ZodError);
  }
});
