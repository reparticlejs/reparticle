import { Emitter, parseEffectConfig } from '@reparticle/core';
import { expect, it } from 'vitest';

import { properties } from '../src/content/properties';
import { propertyExample } from '../src/utils/property-example';
import { propertyUpdate } from '../src/utils/property-update';

it.each([
  ['emission.rate', { rate: 200, rateSpread: 60 }],
  ['initial.speed', { speed: 150, speedSpread: 30 }],
  ['initial.lifetime', { lifetime: 3, lifetimeSpread: 0.5 }],
  ['transform', { x: 30, y: 20, rotation: 45, scale: 2 }],
  [
    'initial.color',
    { red: 1, redSpread: 0.1, green: 0.2, greenSpread: 0.2, blue: 0.4, blueSpread: 0.3 },
  ],
  ['initial.stretch', { stretchX: 1, stretchXSpread: 0.2, stretchY: 2, stretchYSpread: 0.4 }],
  ['emission.shape.dimensions', { width: 200, widthSpread: 20, height: 60, heightSpread: 10 }],
  ['inheritVelocity', 0.5],
  ['stretchWithVelocity', true],
  ['emission.shape.diameter', { diameter: 200, diameterSpread: 30 }],
  ['modifiers', [{ type: 'drag', magnitude: 2 }]],
])('applies %s through the real runtime patch API', (path, value) => {
  const property = properties.find((item) => item.path === path)!;
  const previous = propertyExample(property, property.value);
  const next = propertyExample(property, value);
  const change = propertyUpdate(path, previous, next);
  expect(change?.parameters).toBeDefined();
  const before = parseEffectConfig(previous.definition);
  const after = parseEffectConfig(next.definition);
  const emitter = new Emitter(null, before.emitters[0]);
  try {
    emitter.setParameters(change!.parameters!);
    expect(emitter.configuration).toEqual(after.emitters[0]);
  } finally {
    emitter.destroy();
  }
});

it.each([
  'capacity',
  'seed',
  'space',
  'orientation',
  'playback',
  'startDelay',
  'startOffset',
  'overLifetime.alpha',
  'effect.modifiers',
])('rebuilds authoring-only %s', (path) => {
  const property = properties.find((item) => item.path === path)!;
  const example = propertyExample(property, property.value);
  expect(propertyUpdate(path, example, example)).toBeUndefined();
});

it('switches to reconstruction for a curve, and back to live updates for a number', () => {
  const property = properties.find((item) => item.path === 'initial.speed')!;
  const number = propertyExample(property, { speed: 100, speedSpread: 20 });
  const curve = propertyExample(property, {
    speed: { points: [{ time: 0, value: 100 }] },
    speedSpread: 20,
  });
  expect(propertyUpdate(property.path, number, curve)).toBeUndefined();
  expect(propertyUpdate(property.path, curve, number)?.parameters).toEqual({
    initial: { speed: 100, speedSpread: 20 },
  });
});

it('rebuilds a changed shape type but updates dimensions in place', () => {
  const property = properties.find((item) => item.path === 'emission.shape')!;
  const before = propertyExample(property, { type: 'circle', diameter: 100 });
  const resize = propertyExample(property, { type: 'circle', diameter: 200 });
  const box = propertyExample(property, { type: 'box', width: 100, height: 100 });
  expect(propertyUpdate(property.path, before, resize)?.parameters?.emission?.shape).toEqual({
    diameter: 200,
    diameterSpread: 0,
  });
  expect(propertyUpdate(property.path, before, box)).toBeUndefined();
});

it.each(['rendering', 'artwork.animation', 'artwork.flip'])(
  'routes %s to renderer updates',
  (path) => {
    const property = properties.find((item) => item.path === path)!;
    const example = propertyExample(property, property.value);
    const change = propertyUpdate(path, example, example);
    expect(change?.parameters).toBeUndefined();
    expect(change?.rendering ?? change?.artwork).toBeTruthy();
  },
);

it('updates blend mode and tint together without rebuilding', () => {
  const property = properties.find((item) => item.path === 'rendering')!;
  const previous = propertyExample(property, property.value);
  const next = propertyExample(property, {
    blendMode: 'add',
    red: 0.2,
    green: 0.5,
    blue: 1,
    alpha: 0.7,
  });
  expect(propertyUpdate(property.path, previous, next)?.rendering).toEqual({
    blendMode: 'add',
    tint: { red: 0.2, green: 0.5, blue: 1, alpha: 0.7 },
  });
});

it('rebuilds when rate spread changes but keeps rate-only edits live', () => {
  const property = properties.find((item) => item.path === 'emission.rate')!;
  const previous = propertyExample(property, { rate: 120, rateSpread: 0 });
  const next = propertyExample(property, { rate: 120, rateSpread: 30 });
  expect(propertyUpdate(property.path, previous, next)).toBeUndefined();
});

it.each(['acceleration', 'drag', 'radial', 'vortex'])(
  'updates grouped %s modifier settings live',
  (type) => {
    const property = properties.find((item) => item.path === `modifiers.${type}`)!;
    const previous = propertyExample(property, property.value);
    const next = propertyExample(property, { ...Object(property.value), magnitude: 2, spread: 1 });
    expect(propertyUpdate(property.path, previous, next)?.parameters?.modifiers).toEqual(
      next.definition?.emitters[0]?.modifiers,
    );
  },
);

it('maps grouped animation and flip controls to actual artwork fields', () => {
  const animation = properties.find((item) => item.path === 'artwork.animation')!;
  const flip = properties.find((item) => item.path === 'artwork.flip')!;
  expect(
    propertyExample(animation, { playback: 'once-forward', fps: 20 }).artwork.experiment,
  ).toMatchObject({ playback: 'once-forward', fps: 20 });
  expect(propertyExample(flip, { flipX: true, flipY: true }).artwork.experiment).toMatchObject({
    flipX: true,
    flipY: true,
  });
});
