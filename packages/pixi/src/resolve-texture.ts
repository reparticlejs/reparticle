import type { Texture } from 'pixi.js';

import type { ParticleTexture } from './types/particle-texture';

export function resolveTexture(options: ParticleTexture): Texture | null {
  if (options.atlas) {
    const texture = Object.hasOwn(options.atlas.textures, options.frame)
      ? options.atlas.textures[options.frame]
      : undefined;
    if (!texture) {
      throw new Error(`Unknown particle atlas frame: ${options.frame}`);
    }
    return texture;
  }
  return options.texture;
}
