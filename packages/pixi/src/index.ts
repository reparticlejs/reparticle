import { extensions } from 'pixi.js';

import { ParticlePipe } from '#rendering/particle-pipe.js';

extensions.add(ParticlePipe);

// Effect authoring and runtime parameters used by the Pixi integration.
export type { EffectInput, EmitterParameters, RenderingConfig } from '@reparticle/core';

// Effect display object.
export { ParticleEffect } from '#runtime/particle-effect.js';

// Renderer configuration and lifecycle events.
export type {
  ParticleTexture,
  AnimationFrames,
  AnimationPlayback,
  AnimationSize,
  ParticleSizeMode,
  ParticlePivot,
} from '#types/particle-texture.js';
export type { ParticleStateChange, ParticleStateListener } from '#types/particle-state-change.js';
export type {
  ParticleRendering,
  ParticleTint,
  ParticleBlendMode,
} from '#types/particle-rendering.js';
export type { ParticleEffectOptions } from '#types/particle-effect-options.js';

export { validateAnimationFrames } from '#textures/resolve-flipbook.js';
