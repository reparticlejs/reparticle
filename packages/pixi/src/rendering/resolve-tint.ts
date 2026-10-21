import type { ParticleTint } from '#types/particle-rendering.js';

/** Copy the value so caller mutations cannot change an authored default or runtime override. */
export function resolveTint(
  tint: ParticleTint = { red: 1, green: 1, blue: 1, alpha: 1 },
): ParticleTint {
  if (!tint || ![tint.red, tint.green, tint.blue, tint.alpha].every(Number.isFinite)) {
    throw new RangeError('Particle tint requires four finite RGBA components');
  }
  return { red: tint.red, green: tint.green, blue: tint.blue, alpha: tint.alpha };
}
