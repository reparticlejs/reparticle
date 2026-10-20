import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/parse-effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';

import skeleton from '../../../../docs/effect.example.json';

it('accepts independent signed stretch curves and preserves them through spread edits', () => {
  const source = skeleton.emitters[0]!;
  const curve = {
    points: [
      { time: 0, value: -2, tangent: 3 },
      { time: 1, value: 1, tangent: 3 },
    ],
  };
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        initial: { ...source.initial, stretchX: curve, stretchY: -1 },
        overLifetime: { stretchX: curve, stretchY: 2 },
      },
    ],
  }).emitters[0];
  const changed = updateEmitterConfig(config, {
    initial: { stretchXSpread: 1, stretchYSpread: 2 },
  });
  expect(changed.initial.stretchX).toEqual(curve);
  expect(changed.initial.stretchY).toBe(-1);
  expect(changed.overLifetime.stretchX).toEqual(curve);
  expect(changed.overLifetime.stretchY).toBe(2);
  expect(updateEmitterConfig(changed, { initial: { stretchX: -3 } }).initial.stretchX).toBe(-3);
  expect(config.initial.stretchXSpread).toBe(0);
  for (const initial of [
    { stretchX: curve },
    { stretchY: NaN },
    { stretchXSpread: -1 },
    { stretchYSpread: Infinity },
  ]) {
    expect(() => updateEmitterConfig(config, { initial })).toThrow(ZodError);
  }
});

it('defaults stretch to zero without changing existing size', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...source,
        initial: { ...source.initial, stretchX: undefined, stretchY: undefined },
        overLifetime: undefined,
      },
    ],
  }).emitters[0];
  expect(config.initial.stretchX).toBe(0);
  expect(config.initial.stretchY).toBe(0);
  expect(config.overLifetime.stretchX).toBe(0);
  expect(config.overLifetime.stretchY).toBe(0);
});

it('defaults velocity stretch off and supports live boolean toggles', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...source, stretchWithVelocity: undefined }],
  }).emitters[0];
  expect(config.stretchWithVelocity).toBe(false);
  const enabled = updateEmitterConfig(config, { stretchWithVelocity: true });
  expect(enabled.stretchWithVelocity).toBe(true);
  expect(updateEmitterConfig(enabled, { initial: { stretchY: 2 } }).stretchWithVelocity).toBe(true);
  expect(updateEmitterConfig(enabled, { stretchWithVelocity: false }).stretchWithVelocity).toBe(
    false,
  );
  expect(config.stretchWithVelocity).toBe(false);
  for (const stretchWithVelocity of [0, 1, 'true', null]) {
    expect(() => updateEmitterConfig(config, { stretchWithVelocity })).toThrow(ZodError);
  }
});
