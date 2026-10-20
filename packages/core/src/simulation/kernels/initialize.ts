import type { ParticleTexel } from '#types/layout.js';

/**
 * Write a zero RGBA texel to the particle-state texture.
 *
 * GPU.js runs this kernel for every texel across all five bands, clearing
 * every slot. In particular, the dynamics band's active flag becomes zero,
 * so cleared slots remain inactive even though both age and lifetime are zero.
 *
 * Zeroes are empty storage, not particle defaults. The integration kernel
 * writes the configured initial values when a slot receives a new particle.
 */
export function initialize(): ParticleTexel {
  return [0, 0, 0, 0];
}
