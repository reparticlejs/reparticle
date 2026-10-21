import { extensions } from 'pixi.js';

import { ParticlePipe } from './rendering/particle-pipe';

extensions.add(ParticlePipe);

// Effect display object.
export { ParticleView } from './runtime/particle-view';

// Renderer configuration and lifecycle events.
export type {
  ParticleTexture,
  AnimationPlayback,
  AnimationSize,
  ParticleSizeMode,
  ParticlePivot,
} from './types/particle-texture';
export type { ParticleStateChange, ParticleStateListener } from './types/particle-state-change';
export type { ParticleRendering, ParticleTint } from './types/particle-rendering';
export type { ParticleViewOptions } from './types/particle-view-options';
