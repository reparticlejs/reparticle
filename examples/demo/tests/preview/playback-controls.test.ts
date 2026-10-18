import { parseEffectConfig } from '@reparticle/core';
import { expect, it } from 'vitest';

import { applyControls, emitterParameters, initialControls } from '#src/preview/apply-controls.js';

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

it('maps emitter rotation independently of initial particle rotation', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.rotation = 45;
  const controls = initialControls(definition);
  expect(controls.emitterRotation).toBe(45);
  const changed = applyControls(definition, { ...controls, emitterRotation: 90 });
  expect(changed.rotation).toBe(90);
  expect(changed.initial.rotation).toEqual(definition.initial.rotation);
});

it('maps emitter scale independently of initial particle size', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.scale = 0.5;
  const controls = initialControls(definition);
  expect(controls.emitterScale).toBe(0.5);
  const changed = applyControls(definition, { ...controls, emitterScale: 2 });
  expect(changed.scale).toBe(2);
  expect(changed.initial.size).toEqual(definition.initial.size);
});

it('preserves authored drag curves and maps independent drag edits', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.modifiers.drag.magnitude = {
    points: [
      { time: 0, value: 0, tangent: 2 },
      { time: 1, value: 2, tangent: 2 },
    ],
  };
  const controls = initialControls(definition);
  expect(controls.dragCurve).toBe('effect');
  const changed = applyControls(definition, {
    ...controls,
    dragSpread: 2,
    dragDirectional: true,
    dragRotation: 90,
  });
  expect(changed.modifiers.drag).toEqual({
    magnitude: definition.modifiers.drag.magnitude,
    spread: 2,
    useDirection: true,
    rotation: 90,
  });
});

it('preserves acceleration curves while changing direction and spread', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.modifiers.acceleration.magnitude = {
    points: [
      { time: 0, value: 0, tangent: 100 },
      { time: 1, value: 100, tangent: 100 },
    ],
  };
  const controls = initialControls(definition);
  expect(controls.accelerationCurve).toBe('effect');
  expect(
    applyControls(definition, { ...controls, accelerationRotation: 90, accelerationSpread: 20 })
      .modifiers.acceleration,
  ).toEqual({ magnitude: definition.modifiers.acceleration.magnitude, spread: 20, rotation: 90 });
});

it('preserves radial curves while changing the center, cutoff, and spread', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.modifiers.radial.magnitude = {
    points: [
      { time: 0, value: 0, tangent: 100 },
      { time: 1, value: 100, tangent: 100 },
    ],
  };
  const controls = initialControls(definition);
  expect(controls.radialCurve).toBe('effect');
  expect(
    applyControls(definition, {
      ...controls,
      radialX: 20,
      radialY: -30,
      radialMaxDistance: 200,
      radialSpread: 40,
    }).modifiers.radial,
  ).toEqual({
    magnitude: definition.modifiers.radial.magnitude,
    x: 20,
    y: -30,
    maxDistance: 200,
    spread: 40,
  });
});

it('preserves vortex curves while changing the center, cutoff, and spread', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.modifiers.vortex.magnitude = {
    points: [
      { time: 0, value: 0, tangent: 100 },
      { time: 1, value: 100, tangent: 100 },
    ],
  };
  const controls = initialControls(definition);
  expect(controls.vortexCurve).toBe('effect');
  expect(
    applyControls(definition, {
      ...controls,
      vortexX: 20,
      vortexY: -30,
      vortexMaxDistance: 200,
      vortexSpread: 40,
    }).modifiers.vortex,
  ).toEqual({
    magnitude: definition.modifiers.vortex.magnitude,
    x: 20,
    y: -30,
    maxDistance: 200,
    spread: 40,
    rotation: 0,
  });
});

it('preserves authored spin curves and selects lifetime multiplier presets', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.initial.angularVelocity = { points: [{ time: 0, value: 90, tangent: 90 }] };
  const controls = initialControls(definition);
  expect(controls.initialAngularVelocityCurve).toBe('effect');
  const changed = applyControls(definition, {
    ...controls,
    orientation: 'angular-velocity',
    angularVelocitySpread: 45,
    angularVelocityCurve: 'reverse',
  });
  expect(changed.initial.angularVelocity).toEqual(definition.initial.angularVelocity);
  expect(changed.initial.angularVelocitySpread).toBe(45);
  expect(changed.overLifetime.angularVelocity).toEqual({
    points: [
      { time: 0, value: 1, tangent: -2 },
      { time: 1, value: -1, tangent: -2 },
    ],
  });
});

it('keeps stretch axes independent across birth curves, spread, and lifetime presets', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.initial.stretchX = {
    points: [
      { time: 0, value: 0, tangent: 1 },
      { time: 1, value: 1, tangent: 1 },
    ],
  };
  const controls = initialControls(definition);
  expect(controls.initialStretchXCurve).toBe('effect');
  const changed = applyControls(definition, {
    ...controls,
    stretchXSpread: 0.5,
    stretchY: -2,
    stretchYSpread: 0.25,
    stretchXCurve: 'grow',
    stretchYCurve: 'shrink',
  });
  expect(changed.initial.stretchX).toEqual(definition.initial.stretchX);
  expect(changed.initial.stretchXSpread).toBe(0.5);
  expect(changed.initial.stretchY).toBe(-2);
  expect(changed.initial.stretchYSpread).toBe(0.25);
  expect(changed.overLifetime.stretchX).toEqual(definition.initial.stretchX);
  expect(changed.overLifetime.stretchY).toEqual({
    points: [
      { time: 0, value: 0, tangent: -1 },
      { time: 1, value: -1, tangent: -1 },
    ],
  });
});

it('applies velocity stretch through both initial configuration and runtime updates', () => {
  const definition = parseEffectConfig(effect).emitters[0];
  definition.stretchWithVelocity = true;
  const controls = initialControls(definition);
  expect(controls.stretchWithVelocity).toBe(true);
  expect(
    applyControls(definition, { ...controls, stretchWithVelocity: false }).stretchWithVelocity,
  ).toBe(false);
  expect(emitterParameters(controls).stretchWithVelocity).toBe(true);
  expect(emitterParameters({ ...controls, stretchWithVelocity: false }).stretchWithVelocity).toBe(
    false,
  );
});
