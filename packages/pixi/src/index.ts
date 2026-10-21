import { extensions } from 'pixi.js';

import { ParticlePipe } from './rendering/particle-pipe';

extensions.add(ParticlePipe);

// Effect display object.
export { ParticleEffect } from './runtime/particle-effect';

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

export { validateAnimationFrames } from './textures/resolve-flipbook';
