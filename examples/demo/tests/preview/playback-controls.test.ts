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
