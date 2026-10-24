import type { Texture } from 'pixi.js';

import type { ParticleTexture } from '#types/particle-texture.js';

/** Return borrowed static artwork, or null for procedural particles. */
export function resolveTexture(options: ParticleTexture<Texture>): Texture | null {
  if (options.textures && options.textures.length > 1) {
    throw new Error('Resolve animation frames before selecting a texture');
  }
  return options.textures?.[0] ?? null;
}
