import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults vortex to disabled and preserves curves during numeric edits', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({ version: 1, emitters: [{ ...source, modifiers: {} }] })
    .emitters[0];
  expect(config.modifiers.vortex).toEqual({
    magnitude: 0,
    spread: 0,
    x: 0,
    y: 0,
    maxDistance: 100,
    rotation: 0,
  });
  const curve = {
    points: [
      { time: 0, value: -100, tangent: 200 },
      { time: 1, value: 100, tangent: 200 },
    ],
  };
  config.modifiers.vortex.magnitude = curve;
  const updated = updateEmitterConfig(config, {
    modifiers: { vortex: { x: 10, y: 20, spread: 30, maxDistance: 0, rotation: 90 } },
  });
  expect(updated.modifiers.vortex).toEqual({
    magnitude: curve,
    spread: 30,
    x: 10,
    y: 20,
    maxDistance: 0,
    rotation: 90,
  });
  expect(
    updateEmitterConfig(updated, { modifiers: { vortex: { magnitude: -200 } } }).modifiers.vortex
      .magnitude,
  ).toBe(-200);
  expect(config.modifiers.vortex.x).toBe(0);
  for (const patch of [
    { magnitude: curve },
    { maxDistance: -1 },
    { spread: -1 },
    { x: Infinity },
    { y: NaN },
  ]) {
    expect(() => updateEmitterConfig(config, { modifiers: { vortex: patch } })).toThrow(ZodError);
  }
});
