import { Cache, Texture } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveRendering } from '#config/resolve-rendering.js';

vi.mock('#textures/missing-texture.js', () => ({
  getMissingTexture: () => Texture.EMPTY,
}));

afterEach(() => {
  for (const name of ['test-star', 'test-star-2']) {
    if (Cache.has(name)) {
      Cache.remove(name);
    }
  }
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

  it('keeps omitted artwork procedural without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveRendering({}).textures).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('replaces non-texture cache entries with the placeholder', () => {
    Cache.set('test-star', { notATexture: true });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveRendering({ textures: ['test-star'] }).textures).toEqual([Texture.EMPTY]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('replaces the whole animation when a cached frame is missing, preserving timing', () => {
    Cache.set('test-star', Texture.WHITE);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveRendering({
      textures: ['test-star', 'test-missing', Texture.WHITE],
      playback: 'once-forward',
      fps: 12,
    });
    expect(result.textures).toEqual([Texture.EMPTY, Texture.EMPTY, Texture.EMPTY]);
    expect(result.playback).toBe('once-forward');
    expect(result.fps).toBe(12);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('does not warn about fallback when animation settings are rejected', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => resolveRendering({ textures: ['test-missing', Texture.WHITE], fps: -1 })).toThrow(
      'Particle animation FPS must be finite and nonnegative',
    );
    expect(warn).not.toHaveBeenCalled();
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
