import type { ParticleTexture } from '#types/particle-texture.js';

/**
 * Convert artwork flip flags into the shader's [x, y] multipliers.
 * Each axis uses 1 to preserve its direction or -1 to mirror it; omitted flags use 1.
 *
 * The shader mirrors the trimmed artwork within its original frame before applying
 * the pivot offset and particle rotation. Flipping does not change particle motion
 * or reverse the pivot offset.
 */
export function resolveTextureFlip(options: ParticleTexture): [number, number] {
  const { flipX = false, flipY = false } = options;

  if (typeof flipX !== 'boolean' || typeof flipY !== 'boolean') {
    throw new Error('Particle texture flipX and flipY must be booleans');
  }

  const horizontal = flipX ? -1 : 1;
  const vertical = flipY ? -1 : 1;
  return [horizontal, vertical];
}
