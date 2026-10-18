import type { ParticleTexture } from './particle-texture';

/** Texture selections are keyed by the IDs in the core effect definition. */
export interface ParticleViewOptions {
  emitters: Record<string, ParticleTexture>;
}
