import { parseEffectConfig } from '@reparticle/core';
import { expect, it } from 'vitest';

import { applyControls, initialControls } from '#src/preview/apply-controls.js';

import effect from '../../public/effect.json';

it('preserves authored timing spreads and applies demo edits', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.durationSpread = 0.5;
  definition.startDelaySpread = 0.2;
  const controls = initialControls(definition);
  expect(controls.durationSpread).toBe(0.5);
  expect(controls.startDelaySpread).toBe(0.2);
  const changed = applyControls(definition, {
    ...controls,
    durationSpread: 1,
    startDelaySpread: 0.4,
  });
  expect(changed.durationSpread).toBe(1);
  expect(changed.startDelaySpread).toBe(0.4);
});

it('preserves authored emission spread and applies demo edits', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.emission.rateSpread = 100;
  const controls = initialControls(definition);
  expect(controls.rateSpread).toBe(100);
  expect(applyControls(definition, { ...controls, rateSpread: 200 }).emission.rateSpread).toBe(200);
});

it('loads and updates velocity inheritance without recreating the effect', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.inheritVelocity = 0.5;
  const controls = initialControls(definition);
  expect(controls.inheritVelocity).toBe(0.5);
  expect(applyControls(definition, { ...controls, inheritVelocity: 1 }).inheritVelocity).toBe(1);
});

it('loads emission space and passes space changes to recreated effects', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.space = 'local';
  const controls = initialControls(definition);
  expect(controls.space).toBe('local');
  expect(applyControls(definition, { ...controls, space: 'world' }).space).toBe('world');
});
