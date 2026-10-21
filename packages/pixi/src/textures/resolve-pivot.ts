import type { ParticlePivot } from '#types/particle-texture.js';

/**
 * Resolve the artwork offset from the particle's center: positive X right, positive Y up.
 * The shader applies it in particle-local space before rotation and emitter transforms.
 * Omitting the pivot leaves the artwork centered.
 *
 * Return a copy so later changes to the caller's object cannot bypass validation.
 */
export function resolvePivot(pivot?: ParticlePivot): ParticlePivot {
  if (pivot === undefined) {
    return { x: 0, y: 0 };
  }

  if (!pivot) {
    throw new Error('Particle pivot coordinates must be finite numbers');
  }

  const { x, y } = pivot;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error('Particle pivot coordinates must be finite numbers');
  }

  return { x, y };
}
