import type { ParticleTexture } from './particle-texture';

/** Straight RGBA multiplier, applied after the particle's own color. */
export interface ParticleTint {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

/** Renderer-owned settings; tint is independent of texture replacement and simulation. */
export type ParticleRendering = ParticleTexture & { tint?: ParticleTint };
