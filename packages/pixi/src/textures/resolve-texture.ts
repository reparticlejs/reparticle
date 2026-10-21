import type { Texture } from 'pixi.js';

import type { ParticleTexture } from '#types/particle-texture.js';

/**
 * Select static artwork from a direct texture or a named atlas frame.
 * A null texture selects procedural particles. Animation selections must go through
 * resolveFlipbook instead, which validates their frames and playback settings.
 *
 * Returns the caller's existing texture without loading, copying, or taking ownership.
 */
export function resolveTexture(options: ParticleTexture): Texture | null {
  if (options.animation !== undefined) {
    throw new Error('Resolve animation frames before selecting a texture');
  }
  if (!options.atlas) {
    return options.texture;
  }

  const { textures } = options.atlas;
  const frameName = options.frame;
  // Only authored entries count as frames, never inherited object properties.
  const texture = Object.hasOwn(textures, frameName) ? textures[frameName] : undefined;
  if (!texture) {
    throw new Error(`Unknown particle atlas frame: ${frameName}`);
  }

  return texture;
}
