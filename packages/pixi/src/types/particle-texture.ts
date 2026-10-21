import type { PointData, Size, Texture } from 'pixi.js';

export type AnimationPlayback =
  | 'none'
  | 'once-forward'
  | 'once-backward'
  | 'once-pingpong'
  | 'loop-forward'
  | 'loop-backward'
  | 'loop-pingpong';

export type ParticleSizeMode = 'manual' | 'auto';

/** Offset from the centered geometry: positive X right, positive Y up. */
export type ParticlePivot = PointData;

/** Animation reference dimensions in logical texture units. */
export type AnimationSize = Size;

/** Caller owns the textures, including frames loaded by a Pixi Spritesheet. */
export type ParticleTexture = {
  sizeMode?: ParticleSizeMode;
  pivot?: ParticlePivot;
  /** Mirror artwork in particle-local axes, without changing the pivot or simulation. */
  flipX?: boolean;
  flipY?: boolean;
} & (
  | { texture: Texture | null; atlas?: never; frame?: never; animation?: never }
  | {
      atlas: { textures: Record<string, Texture> };
      frame: string;
      texture?: never;
      animation?: never;
    }
  | {
      atlas: { animations: Record<string, Texture[]> };
      animation: string;
      /** Defaults to the first authored frame's original size; independent of playback order. */
      animationSize?: AnimationSize;
      playback?: AnimationPlayback;
      fps?: number;
      texture?: never;
      frame?: never;
    }
);
