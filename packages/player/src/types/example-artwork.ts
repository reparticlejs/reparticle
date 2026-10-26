import type {
  AnimationPlayback,
  AnimationSize,
  ParticlePivot,
  ParticleSizeMode,
} from '@reparticle/pixi';

/** A standalone image, named atlas frame, or named atlas animation. */
export interface ExampleArtwork {
  /** Image or spritesheet URL relative to the application's base URL. */
  source: string;
  /** Named static frame within a spritesheet. */
  frame?: string;
  /** Named spritesheet animation; takes precedence over frame when both are supplied. */
  animation?: string;
  /** Animation-only playback settings passed to the Pixi renderer. */
  playback?: AnimationPlayback;
  fps?: number;
  animationSize?: AnimationSize;
  sizeMode?: ParticleSizeMode;
  pivot?: ParticlePivot;
  flipX?: boolean;
  flipY?: boolean;
}
