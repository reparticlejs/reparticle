import { Cache, Texture } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveRendering } from '../src/config/resolve-rendering';

vi.mock('../src/textures/missing-texture', () => ({
  getMissingTexture: () => Texture.EMPTY,
}));

afterEach(() => {
  Cache.remove('test-star');
  Cache.remove('test-star-2');
  vi.restoreAllMocks();
});

describe('cached particle textures', () => {
  it('resolves a name without warning or changing the supplied options', () => {
    Cache.set('test-star', Texture.WHITE);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const options = { textures: ['test-star'] as const };
    expect(resolveRendering(options).textures).toEqual([Texture.WHITE]);
    expect(options.textures).toEqual(['test-star']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('accepts mixed cache names and textures in animations', () => {
    Cache.set('test-star', Texture.WHITE);
    const result = resolveRendering({
      textures: ['test-star', Texture.WHITE],
      playback: 'loop-forward',
      fps: 12,
    });
    expect(result.textures).toEqual([Texture.WHITE, Texture.WHITE]);
    expect(result.fps).toBe(12);
  });

  it('preserves missing-artwork fallback and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveRendering({ textures: ['test-missing'] }).textures).toEqual([Texture.EMPTY]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('still rejects animation frames from different sources', () => {
    Cache.set('test-star', Texture.WHITE);
    Cache.set('test-star-2', Texture.EMPTY);
    expect(() =>
      resolveRendering({
        textures: ['test-star', 'test-star-2'],
      }),
    ).toThrow('must share one texture source');
  });
});
