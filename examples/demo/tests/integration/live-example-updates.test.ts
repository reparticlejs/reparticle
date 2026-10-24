import { ParticleEffect } from '@reparticle/pixi';
import { Application, Texture, type WebGLRenderer } from 'pixi.js';
import { afterEach, expect, it, vi } from 'vitest';

import { loadArtwork } from '../../src/runtime/artwork';
import { loadExample } from '../../src/runtime/example';
import { createExamplePlayer } from '../../src/runtime/example-player';
import type { Example } from '../../src/types/example';
import effectDefinition from '../fixtures/effect';

vi.mock('../../src/runtime/example');
vi.mock('../../src/runtime/artwork');

afterEach(() => vi.resetAllMocks());

async function setup() {
  const app = new Application<WebGLRenderer>();
  const effect = new ParticleEffect(effectDefinition, { autoUpdate: false });
  const mounted = {
    effect,
    restart: vi.fn<() => void>(),
    destroy: vi.fn<() => void>(() => effect.destroy()),
  };
  vi.mocked(loadExample).mockResolvedValue(mounted);
  const stats = {
    setEffect: vi.fn<(effect: ParticleEffect | undefined) => void>(),
    destroy: vi.fn<() => void>(),
  };
  const player = createExamplePlayer(app, stats);
  const example: Example = { id: 'test', name: 'Test', file: '', artwork: {} };
  await player.select(example);
  stats.setEffect.mockClear();
  return { player, effect, mounted, stats, example };
}

it('keeps the effect, pause state, stats, and playback while changing parameters and tint', async () => {
  const { player, effect, mounted, stats, example } = await setup();
  const reset = vi.spyOn(effect, 'reset');
  try {
    expect(
      await player.update(example, { emitterId: 'sparks', parameters: { initial: { speed: 12 } } }),
    ).toBe(true);
    expect(effect.emitter.configuration.initial.speed).toBe(12);
    await player.update(example, {
      emitterId: 'sparks',
      rendering: { blendMode: 'add', tint: { red: 1, green: 0, blue: 0, alpha: 1 } },
    });
    expect(effect.getEmitterTint('sparks').green).toBe(0);
    expect(effect.autoUpdate).toBe(false);
    expect(reset).not.toHaveBeenCalled();
    expect(mounted.restart).not.toHaveBeenCalled();
    expect(mounted.destroy).not.toHaveBeenCalled();
    expect(stats.setEffect).not.toHaveBeenCalled();
    expect(loadExample).toHaveBeenCalledTimes(1);
  } finally {
    player.destroy();
  }
});

it('replaces artwork without replacing the simulation', async () => {
  const { player, effect, mounted, example } = await setup();
  vi.mocked(loadArtwork).mockResolvedValue({ sparks: { textures: [Texture.EMPTY] } });
  try {
    const emitter = effect.emitter;
    await player.update(example, { emitterId: 'sparks', artwork: true });
    expect(effect.emitter).toBe(emitter);
    expect(effect.getEmitterTexture('sparks')).toBe(Texture.EMPTY);
    expect(mounted.destroy).not.toHaveBeenCalled();
  } finally {
    player.destroy();
  }
});

it('ignores a pending artwork load after destruction', async () => {
  const { player, effect, example } = await setup();
  let resolve: ((artwork: Awaited<ReturnType<typeof loadArtwork>>) => void) | undefined;
  const pending = new Promise<Awaited<ReturnType<typeof loadArtwork>>>((finish) => {
    resolve = finish;
  });
  vi.mocked(loadArtwork).mockReturnValue(pending);
  const setTexture = vi.spyOn(effect, 'setEmitterTexture');
  const update = player.update(example, { emitterId: 'sparks', artwork: true });
  player.destroy();
  resolve?.({ sparks: { textures: [Texture.EMPTY] } });
  expect(await update).toBe(false);
  expect(setTexture).not.toHaveBeenCalled();
});

it('ignores a stale artwork failure after a newer edit', async () => {
  const { player, effect, example } = await setup();
  let reject: ((error: Error) => void) | undefined;
  const pending = new Promise<Awaited<ReturnType<typeof loadArtwork>>>((_resolve, fail) => {
    reject = fail;
  });
  vi.mocked(loadArtwork).mockReturnValue(pending);
  try {
    const stale = player.update(example, { emitterId: 'sparks', artwork: true });
    await player.update(example, { emitterId: 'sparks', parameters: { scale: 2 } });
    reject?.(new Error('Old load failed'));
    expect(await stale).toBe(false);
    expect(effect.emitter.scale).toBe(2);
  } finally {
    player.destroy();
  }
});
