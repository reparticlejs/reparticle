import { extensions } from 'pixi.js';

import { ParticlePipe } from '#rendering/particle-pipe.js';

// Register the render pipe when the Pixi integration is imported.
extensions.add(ParticlePipe);

// Particle effect and lifecycle.
export { ParticleEffect } from '#runtime/particle-effect.js';
export type { ParticleEffectOptions } from '#types/particle-effect-options.js';
export type { ParticleStateChange, ParticleStateListener } from '#types/particle-state-change.js';

// Configuration types needed by Pixi consumers.
export type { EffectInput, EmitterParameters, RenderingConfig } from '@reparticle/core';
export type {
  ParticleRendering,
  ParticleTint,
  ParticleBlendMode,
} from '#types/particle-rendering.js';

// Textures and animation.
export { validateAnimationFrames } from '#textures/resolve-flipbook.js';
export type {
  ParticleTexture,
  AnimationFrames,
  AnimationPlayback,
  AnimationSize,
  ParticleSizeMode,
  ParticlePivot,
} from '#types/particle-texture.js';
