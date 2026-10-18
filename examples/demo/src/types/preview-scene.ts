import type { EffectConfig } from '@reparticle/core';
import type { ParticleTexture } from '@reparticle/pixi';

import type { ParticleTextureName } from './preview';

export interface PreviewAssets {
  effect: EffectConfig;
  textures: Record<ParticleTextureName, ParticleTexture>;
}
