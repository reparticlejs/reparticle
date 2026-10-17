import type { EffectConfig } from '@reparticle/core';
import type { Texture } from 'pixi.js';

import type { ParticleTextureName } from './preview';

export interface PreviewAssets {
  effect: EffectConfig;
  textures: Record<ParticleTextureName, Texture | null>;
}
