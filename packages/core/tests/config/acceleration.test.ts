import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults acceleration to zero and preserves curves during numeric modifier edits', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({ version: 1, emitters: [{ ...source, modifiers: {} }] })
    .emitters[0];
  expect(config.modifiers.acceleration).toEqual({ magnitude: 0, spread: 0, rotation: 0 });
  const curve = {
    points: [
      { time: 0, value: 0, tangent: 100 },
      { time: 1, value: 100, tangent: 100 },
    ],
  };
  config.modifiers.acceleration.magnitude = curve;
  const updated = updateEmitterConfig(config, {
    modifiers: { acceleration: { spread: 20, rotation: 90 }, drag: { magnitude: 2 } },
  });
  expect(updated.modifiers.acceleration).toEqual({ magnitude: curve, spread: 20, rotation: 90 });
  expect(updated.modifiers.drag.magnitude).toBe(2);
  expect(
    updateEmitterConfig(updated, { modifiers: { acceleration: { magnitude: -10 } } }).modifiers
      .acceleration.magnitude,
  ).toBe(-10);
  expect(() =>
    updateEmitterConfig(config, { modifiers: { acceleration: { magnitude: curve } } }),
  ).toThrow(ZodError);
  for (const spread of [-1, NaN, Infinity]) {
    expect(() => updateEmitterConfig(config, { modifiers: { acceleration: { spread } } })).toThrow(
      ZodError,
    );
  }
});
