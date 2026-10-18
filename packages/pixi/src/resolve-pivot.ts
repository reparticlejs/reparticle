import type { ParticlePivot } from './types/particle-texture';

/** Copy caller data so later mutations cannot bypass validation. */
export function resolvePivot(pivot: ParticlePivot = { x: 0, y: 0 }): ParticlePivot {
  if (!pivot || !Number.isFinite(pivot.x) || !Number.isFinite(pivot.y)) {
    throw new Error('Particle pivot coordinates must be finite numbers');
  }
  return { x: pivot.x, y: pivot.y };
}
