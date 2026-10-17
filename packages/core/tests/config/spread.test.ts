import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults property spreads to zero and updates them independently', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        initial: { ...source.initial, speedSpread: undefined, lifetimeSpread: undefined },
      },
    ],
  }).emitters[0];
  expect(config.initial.speedSpread).toBe(0);
  expect(config.initial.lifetimeSpread).toBe(0);
  const changed = updateEmitterConfig(config, { initial: { speedSpread: 300, lifetimeSpread: 3 } });
  expect(changed.initial.speedSpread).toBe(300);
  expect(updateEmitterConfig(changed, { initial: { lifetime: 1 } }).initial.lifetimeSpread).toBe(3);
  for (const value of [-1, Infinity, NaN, undefined]) {
    expect(() => updateEmitterConfig(config, { initial: { speedSpread: value } })).toThrow(
      ZodError,
    );
    expect(() => updateEmitterConfig(config, { initial: { lifetimeSpread: value } })).toThrow(
      ZodError,
    );
  }
});

it('defaults size and rotation spreads and preserves independent numeric updates', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        initial: { ...source.initial, sizeSpread: undefined, rotationSpread: undefined },
      },
    ],
  }).emitters[0];
  expect(config.initial.sizeSpread).toBe(0);
  expect(config.initial.rotationSpread).toBe(0);
  const changed = updateEmitterConfig(config, { initial: { sizeSpread: 40, rotationSpread: 720 } });
  expect(
    updateEmitterConfig(changed, { initial: { size: 10, rotation: -90 } }).initial,
  ).toMatchObject({ sizeSpread: 40, rotationSpread: 720 });
  for (const value of [-1, Infinity, NaN, undefined]) {
    expect(() => updateEmitterConfig(config, { initial: { sizeSpread: value } })).toThrow(ZodError);
    expect(() => updateEmitterConfig(config, { initial: { rotationSpread: value } })).toThrow(
      ZodError,
    );
  }
});
