import type { ParticleRendering } from '#types/particle-rendering.js';

/** Rendering settings are keyed by the IDs in the core effect definition. */
export interface ParticleViewOptions {
  emitters: Record<string, ParticleRendering>;
}
