import { ParticleEffect, validateAnimationFrames, type ParticleTexture } from '@reparticle/pixi';
import { Texture, Ticker } from 'pixi.js';
import { expect, expectTypeOf, it, vi } from 'vitest';

import effectDefinition from '../fixtures/effect';

const config = effectDefinition;
const emitterId = config.emitters[0].id;

it('binds borrowed textures by emitter ID without adding artwork to core', () => {
  const effect = new ParticleEffect(config, {
    autoUpdate: false,
    emitters: { [emitterId]: { textures: [Texture.WHITE] } },
  });
  expect(effect.texture).toBe(Texture.WHITE);
  expect(effect.emitter.configuration.rendering).toEqual(config.emitters[0].rendering);
  effect.destroy();
  expect(Texture.WHITE.destroyed).toBe(false);
});

it('uses procedural artwork when bindings are omitted', () => {
  const effect = new ParticleEffect(config, { autoUpdate: false });
  expect(effect.texture).toBeNull();
  effect.destroy();
});

it.each([
  { textures: [Texture.WHITE], fps: 24 },
  { playback: 'loop-forward' },
  { textures: [Texture.WHITE, Texture.WHITE], fps: -1 },
  { textures: [Texture.WHITE, Texture.WHITE], playback: 'invalid' },
  { textures: [Texture.WHITE, Texture.EMPTY] },
])('rejects invalid artwork before attaching a ticker: %j', (artwork) => {
  const ticker = new Ticker();
  expect(() =>
    Reflect.construct(ParticleEffect, [
      config,
      {
        ticker,
        emitters: { [emitterId]: artwork },
      },
    ]),
  ).toThrow(/Particle|Animation|Unknown/);
  expect(ticker.count).toBe(0);
  ticker.destroy();
});

it('narrows loaded arrays and uses their first authored animation frame', () => {
  const frames: Texture[] = [Texture.WHITE, Texture.WHITE];
  validateAnimationFrames(frames);
  const artwork: ParticleTexture = { textures: frames, playback: 'loop-forward', fps: 24 };
  const effect = new ParticleEffect(config, {
    autoUpdate: false,
    emitters: { [emitterId]: artwork },
  });
  expect(effect.texture).toBe(Texture.WHITE);
  effect.destroy();
  expect(() => validateAnimationFrames([Texture.WHITE])).toThrow(/Particle|Animation|Unknown/);
});

it('allows animation properties only with at least two frames', () => {
  expectTypeOf<{ textures: [Texture]; fps: number }>().not.toExtend<ParticleTexture>();
  expectTypeOf<{ textures: [] }>().not.toExtend<ParticleTexture>();
  expectTypeOf<{ textures: [Texture, Texture]; fps: number }>().toExtend<ParticleTexture>();
});

it('preserves appearance when replacing artwork and keeps textures caller-owned', () => {
  const effect = new ParticleEffect(config, { autoUpdate: false });
  effect.setEmitterBlendMode(emitterId, 'add');
  effect.setTexture({ textures: [Texture.WHITE] });
  expect(effect.getRendering(emitterId).blendMode).toBe('add');
  effect.destroy();
  expect(Texture.WHITE.destroyed).toBe(false);
});

it.each([
  { textures: [] },
  { textures: [undefined] },
  { textures: Array<Texture>(2) },
  { textures: [null] },
  { textures: [Texture.WHITE, undefined] },
])('uses shared diagnostic artwork for invalid supplied textures: %j', ({ textures }) => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const effect: ParticleEffect = Reflect.construct(ParticleEffect, [
    config,
    {
      autoUpdate: false,
      emitters: { [emitterId]: { textures } },
    },
  ]);
  try {
    const fallback = effect.texture;
    expect(fallback).toBeInstanceOf(Texture);
    expect(fallback?.width).toBe(32);
    expect(warning).toHaveBeenCalledTimes(1);
    effect.setTexture({ textures: [Texture.WHITE] });
    expect(effect.texture).toBe(Texture.WHITE);
    expect(fallback?.destroyed).toBe(false);
  } finally {
    effect.destroy();
    warning.mockRestore();
  }
});

it('reuses the placeholder and keeps it alive when an effect is destroyed', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const first = new ParticleEffect(config, { autoUpdate: false });
  const second = new ParticleEffect(config, { autoUpdate: false });
  const destroyed = new Texture();
  destroyed.destroy();
  try {
    first.setTexture({ textures: [destroyed] });
    second.setTexture({ textures: [destroyed] });
    expect(first.texture).toBe(second.texture);
    first.destroy();
    expect(second.texture?.destroyed).toBe(false);
    expect(warning).toHaveBeenCalledTimes(2);
  } finally {
    second.destroy();
    warning.mockRestore();
  }
});
