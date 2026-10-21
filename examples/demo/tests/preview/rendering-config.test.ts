import { parseEffectConfig } from '@reparticle/core';
import { ParticleEffect, validateAnimationFrames, type ParticleTexture } from '@reparticle/pixi';
import { Texture, Ticker } from 'pixi.js';
import { expect, expectTypeOf, it, vi } from 'vitest';

import effect from '../../public/effect.json';

const definition = parseEffectConfig(effect);
const emitterId = definition.emitters[0].id;

it('binds borrowed textures by emitter ID without adding artwork to core', () => {
  const particles = new ParticleEffect(definition, {
    autoUpdate: false,
    emitters: { [emitterId]: { textures: [Texture.WHITE] } },
  });
  expect(particles.texture).toBe(Texture.WHITE);
  expect(particles.emitter.configuration.rendering).toEqual(definition.emitters[0].rendering);
  particles.destroy();
  expect(Texture.WHITE.destroyed).toBe(false);
});

it('uses procedural artwork when bindings are omitted', () => {
  const particles = new ParticleEffect(definition, { autoUpdate: false });
  expect(particles.texture).toBeNull();
  particles.destroy();
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
      definition,
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
  const particles = new ParticleEffect(definition, {
    autoUpdate: false,
    emitters: { [emitterId]: artwork },
  });
  expect(particles.texture).toBe(Texture.WHITE);
  particles.destroy();
  expect(() => validateAnimationFrames([Texture.WHITE])).toThrow(/Particle|Animation|Unknown/);
});

it('allows animation properties only with at least two frames', () => {
  expectTypeOf<{ textures: [Texture]; fps: number }>().not.toExtend<ParticleTexture>();
  expectTypeOf<{ textures: [] }>().not.toExtend<ParticleTexture>();
  expectTypeOf<{ textures: [Texture, Texture]; fps: number }>().toExtend<ParticleTexture>();
});

it('preserves appearance when replacing artwork and keeps textures caller-owned', () => {
  const particles = new ParticleEffect(definition, { autoUpdate: false });
  particles.setEmitterBlendMode(emitterId, 'add');
  particles.setTexture({ textures: [Texture.WHITE] });
  expect(particles.getRendering(emitterId).blendMode).toBe('add');
  particles.destroy();
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
  const particles: ParticleEffect = Reflect.construct(ParticleEffect, [
    definition,
    {
      autoUpdate: false,
      emitters: { [emitterId]: { textures } },
    },
  ]);
  try {
    const fallback = particles.texture;
    expect(fallback).toBeInstanceOf(Texture);
    expect(fallback?.width).toBe(32);
    expect(warning).toHaveBeenCalledTimes(1);
    particles.setTexture({ textures: [Texture.WHITE] });
    expect(particles.texture).toBe(Texture.WHITE);
    expect(fallback?.destroyed).toBe(false);
  } finally {
    particles.destroy();
    warning.mockRestore();
  }
});

it('reuses the placeholder and keeps it alive when an effect is destroyed', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const first = new ParticleEffect(definition, { autoUpdate: false });
  const second = new ParticleEffect(definition, { autoUpdate: false });
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
