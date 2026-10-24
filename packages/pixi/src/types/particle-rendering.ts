import type { ParticleBlendMode, ParticleTint } from '@reparticle/core';
import type { Texture } from 'pixi.js';

import type { ParticleTexture } from '#types/particle-texture.js';

export type { ParticleBlendMode, ParticleTint } from '@reparticle/core';

/** Resolved Pixi artwork for drawing, never stored in the core effect definition. */
export type ParticleRendering<T extends Texture | string = Texture | string> =
  ParticleTexture<T> & {
    tint?: ParticleTint | undefined;
    blendMode?: ParticleBlendMode | undefined;
  };

/** Validated renderer settings with the default blend mode applied. */
export type ResolvedParticleRendering = ParticleRendering<Texture> & {
  blendMode: ParticleBlendMode;
};
