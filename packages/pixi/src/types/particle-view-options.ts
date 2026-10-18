import type { ParticleRendering } from './particle-rendering';

/** Rendering settings are keyed by the IDs in the core effect definition. */
export interface ParticleViewOptions {
  emitters: Record<string, ParticleRendering>;
}
