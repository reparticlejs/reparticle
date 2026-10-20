import type { ParticleTexel } from '#types/layout.js';

/** Clear every slot. A zero active flag prevents unused particles from rendering. */
export function initialize(): ParticleTexel {
  return [0, 0, 0, 0];
}
