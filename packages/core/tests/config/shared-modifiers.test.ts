import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';

import skeleton from '../../../../docs/effect.example.json';

it('accepts shared modifiers without overriding emitter modifiers', () => {
  const effect = parseEffectConfig({ ...skeleton, modifiers: { drag: { magnitude: 3 } } });
  expect(effect.modifiers.drag.magnitude).toBe(3);
  expect(effect.emitters[0].modifiers.drag.magnitude).toBe(0);
  expect(parseEffectConfig(skeleton).modifiers.acceleration.magnitude).toBe(0);
});

it('rejects malformed shared modifiers before allocation', () => {
  for (const modifiers of [
    null,
    { gravity: 1 },
    { radial: { maxDistance: -1 } },
    { drag: { magnitude: Infinity } },
  ]) {
    expect(() => parseEffectConfig({ ...skeleton, modifiers })).toThrow(ZodError);
  }
});
