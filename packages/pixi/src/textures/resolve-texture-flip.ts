import type { ParticleTexture } from '#types/particle-texture.js';

export function resolveTextureFlip({
  flipX = false,
  flipY = false,
}: ParticleTexture): [number, number] {
  if (typeof flipX !== 'boolean' || typeof flipY !== 'boolean') {
    throw new Error('Particle texture flipX and flipY must be booleans');
  }
  return [flipX ? -1 : 1, flipY ? -1 : 1];
}
