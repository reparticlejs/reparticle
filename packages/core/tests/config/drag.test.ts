import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults drag to zero and preserves authored curves during other modifier updates', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...source, modifiers: { acceleration: source.modifiers.acceleration } }],
  }).emitters[0];
  expect(config.modifiers.drag).toEqual({
    magnitude: 0,
    spread: 0,
    useDirection: false,
    rotation: 0,
  });
  config.modifiers.drag.magnitude = {
    points: [
      { time: 0, value: 0, tangent: 10 },
      { time: 1, value: 10, tangent: 10 },
    ],
  };
  const updated = updateEmitterConfig(config, {
    modifiers: { drag: { spread: 2, useDirection: true, rotation: 90 } },
  });
  expect(updated.modifiers.drag.magnitude).toEqual(config.modifiers.drag.magnitude);
  expect(updated.modifiers.acceleration).toEqual(config.modifiers.acceleration);
  expect(
    updateEmitterConfig(updated, { modifiers: { drag: { magnitude: -1 } } }).modifiers.drag
      .magnitude,
  ).toBe(-1);
  expect(() =>
    updateEmitterConfig(config, {
      modifiers: { drag: { magnitude: config.modifiers.drag.magnitude } },
    }),
  ).toThrow(ZodError);
  expect(() => updateEmitterConfig(config, { modifiers: { drag: { spread: -1 } } })).toThrow(
    ZodError,
  );
});
