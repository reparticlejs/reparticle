import type { ParticleTexel } from '#types/layout.js';

/** Clear every slot. An initialized flag of zero prevents unused particles from rendering. */
export function initialize(): ParticleTexel {
  return [0, 0, 0, 0];
}
