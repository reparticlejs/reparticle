import type { ParticleTint } from '#types/particle-rendering.js';

/**
 * Resolve a per-emitter RGBA multiplier. White with alpha 1 leaves colors unchanged.
 * This is separate from ParticleView.tint and inherited Pixi tint; the shader
 * combines them with the particle's own color and artwork.
 *
 * Components must be finite, but are not clamped: negative and above-one values
 * are supported. Keep RGB straight here; the shader premultiplies it by tint alpha.
 * Return a copy so caller mutations cannot change a stored default or override.
 */
export function resolveTint(tint?: ParticleTint): ParticleTint {
  if (tint === undefined) {
    return { red: 1, green: 1, blue: 1, alpha: 1 };
  }

  if (!tint) {
    throw new RangeError('Particle tint requires four finite RGBA components');
  }

  const { red, green, blue, alpha } = tint;
  if (
    !Number.isFinite(red) ||
    !Number.isFinite(green) ||
    !Number.isFinite(blue) ||
    !Number.isFinite(alpha)
  ) {
    throw new RangeError('Particle tint requires four finite RGBA components');
  }

  return { red, green, blue, alpha };
}
