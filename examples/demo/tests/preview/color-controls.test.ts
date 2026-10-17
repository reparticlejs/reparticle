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

it('maps birth rotation and restores the JSON lifetime rotation independently', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = {
    ...initialControls(definition),
    rotation: 45,
    rotationCurve: 'full-turn' as const,
  };
  expect(emitterParameters(controls).initial?.rotation).toBe(45);
  const changed = applyControls(definition, controls);
  expect(changed.initial.rotation).toBe(45);
  expect(changed.overLifetime.rotation).toEqual({
    points: [
      { time: 0, value: 0, tangent: 360 },
      { time: 1, value: 360, tangent: 360 },
    ],
  });
  expect(applyControls(definition, { ...controls, rotationCurve: 'effect' }).overLifetime).toEqual(
    definition.overLifetime,
  );
});

it('maps size and rotation spreads without replacing lifetime curves', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = { ...initialControls(definition), sizeSpread: 12, rotationSpread: 180 };
  const changed = applyControls(definition, controls);
  expect(changed.initial).toMatchObject({ sizeSpread: 12, rotationSpread: 180 });
  expect(emitterParameters(controls).initial).toMatchObject({
    sizeSpread: 12,
    rotationSpread: 180,
  });
  expect(initialControls(changed)).toMatchObject({ sizeSpread: 12, rotationSpread: 180 });
  expect(changed.overLifetime).toEqual(definition.overLifetime);
});

it('maps RGBA spreads while retaining lifetime curves', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const spreads = { redSpread: 0.1, greenSpread: 0.2, blueSpread: 0.3, alphaSpread: 0.4 };
  const controls = { ...initialControls(definition), ...spreads };
  const changed = applyControls(definition, controls);
  expect(changed.initial).toMatchObject(spreads);
  expect(emitterParameters(controls).initial).toMatchObject(spreads);
  expect(initialControls(changed)).toMatchObject(spreads);
  expect(changed.overLifetime).toEqual(definition.overLifetime);
});

it('preserves an authored emission curve during numeric appearance updates', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = { ...initialControls(definition), rateCurve: 'ramp-up' as const, rate: 100 };
  const configured = applyControls(definition, controls);
  const restored = initialControls(configured);
  expect(restored.rateCurve).toBe('effect');
  expect(applyControls(configured, restored).emission.rate).toEqual(configured.emission.rate);
  expect(emitterParameters({ ...restored, size: 40 }).emission?.rate).toBeUndefined();
});

it('restores authored speed curves and leaves them intact during unrelated numeric updates', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = { ...initialControls(definition), speedCurve: 'ramp-up' as const, speed: 200 };
  const configured = applyControls(definition, controls);
  expect(configured.initial.speed).toEqual({
    points: [
      { time: 0, value: 0, tangent: 200 },
      { time: 1, value: 200, tangent: 200 },
    ],
  });
  const restored = initialControls(configured);
  expect(restored.speedCurve).toBe('effect');
  expect(applyControls(configured, restored).initial.speed).toEqual(configured.initial.speed);
  expect(
    emitterParameters({ ...restored, gravity: 50, speedSpread: 20 }).initial?.speed,
  ).toBeUndefined();
  expect(emitterParameters({ ...restored, speedCurve: 'constant', speed: 50 }).initial?.speed).toBe(
    50,
  );
});

it('keeps emitter-time size separate from particle-lifetime scale', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = {
    ...initialControls(definition),
    initialSizeCurve: 'ramp-up' as const,
    size: 40,
    sizeCurve: 'shrink' as const,
  };
  const configured = applyControls(definition, controls);
  expect(configured.initial.size).toEqual({
    points: [
      { time: 0, value: 0, tangent: 40 },
      { time: 1, value: 40, tangent: 40 },
    ],
  });
  const restored = initialControls(configured);
  expect(restored.initialSizeCurve).toBe('effect');
  expect(applyControls(configured, restored).initial.size).toEqual(configured.initial.size);
  expect(applyControls(configured, restored).overLifetime.scale).toEqual(
    configured.overLifetime.scale,
  );
  expect(
    emitterParameters({ ...restored, sizeSpread: 10, gravity: 50 }).initial?.size,
  ).toBeUndefined();
  expect(
    emitterParameters({ ...restored, initialSizeCurve: 'constant', size: 20 }).initial?.size,
  ).toBe(20);
});

it('keeps emitter rotation separate from particle rotation and preserves authored curves', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = {
    ...initialControls(definition),
    initialRotationCurve: 'ramp-up' as const,
    rotation: 180,
    rotationCurve: 'full-turn' as const,
  };
  const configured = applyControls(definition, controls);
  expect(configured.initial.rotation).toEqual({
    points: [
      { time: 0, value: 0, tangent: 180 },
      { time: 1, value: 180, tangent: 180 },
    ],
  });
  const restored = initialControls(configured);
  expect(restored.initialRotationCurve).toBe('effect');
  expect(applyControls(configured, restored).initial.rotation).toEqual(configured.initial.rotation);
  expect(applyControls(configured, restored).overLifetime.rotation).toEqual(
    configured.overLifetime.rotation,
  );
  expect(emitterParameters({ ...restored, rotationSpread: 30 }).initial?.rotation).toBeUndefined();
  expect(
    emitterParameters({ ...restored, initialRotationCurve: 'constant', rotation: -90 }).initial
      ?.rotation,
  ).toBe(-90);
});

it('keeps emitter RGBA curves separate from particle curves and numeric patches', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = {
    ...initialControls(definition),
    initialRedCurve: 'ramp-up' as const,
    initialGreenCurve: 'fade-out' as const,
    initialBlueCurve: 'ramp-up' as const,
    initialAlphaCurve: 'fade-out' as const,
    red: 0.8,
    green: 0.6,
    blue: 0.4,
    alpha: 0.2,
  };
  const configured = applyControls(definition, controls);
  const restored = initialControls(configured);
  expect(restored.initialRedCurve).toBe('effect');
  expect(restored.initialAlphaCurve).toBe('effect');
  expect(applyControls(configured, restored).initial).toEqual(configured.initial);
  expect(configured.overLifetime).toEqual(definition.overLifetime);
  const patch = emitterParameters({ ...restored, redSpread: 0.5, alphaSpread: 0.5 });
  for (const channel of ['red', 'green', 'blue', 'alpha'] as const) {
    expect(patch.initial?.[channel]).toBeUndefined();
    expect(typeof configured.initial[channel]).toBe('object');
  }
  expect(
    emitterParameters({ ...restored, initialRedCurve: 'constant', red: 0.3 }).initial?.red,
  ).toBe(0.3);
});

it('preserves authored lifetime curves during unrelated numeric edits', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  const controls = {
    ...initialControls(definition),
    initialLifetimeCurve: 'ramp-up' as const,
    lifetime: 2,
  };
  const configured = applyControls(definition, controls);
  const restored = initialControls(configured);
  expect(restored.initialLifetimeCurve).toBe('effect');
  expect(applyControls(configured, restored).initial.lifetime).toEqual(configured.initial.lifetime);
  expect(emitterParameters({ ...restored, lifetimeSpread: 0.5 }).initial?.lifetime).toBeUndefined();
});
