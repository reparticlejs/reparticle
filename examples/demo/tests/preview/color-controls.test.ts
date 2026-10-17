import { parseEffectConfig } from '@reparticle/core';
import { expect, it } from 'vitest';

import { applyControls, emitterParameters, initialControls } from '#src/preview/apply-controls.js';

import effect from '../../public/effect.json';

it('passes birth RGB changes through numeric parameters and preserves independent curves', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = {
    ...initialControls(definition),
    red: 0.2,
    green: 0.4,
    blue: 0.6,
    colorCurve: 'fire' as const,
  };
  expect(emitterParameters(controls).initial).toMatchObject({ red: 0.2, green: 0.4, blue: 0.6 });
  const changed = applyControls(definition, controls);
  expect(changed.initial.red).toBe(0.2);
  expect(changed.overLifetime.red).toBe(1);
  expect(changed.overLifetime.alpha).toEqual(definition.overLifetime.alpha);
  expect(changed.overLifetime.scale).toEqual(definition.overLifetime.scale);
  expect(applyControls(definition, { ...controls, colorCurve: 'effect' }).overLifetime).toEqual(
    definition.overLifetime,
  );
});
