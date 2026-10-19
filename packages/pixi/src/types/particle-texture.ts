import type { Texture } from 'pixi.js';

export type AnimationPlayback =
  | 'none'
  | 'once-forward'
  | 'once-backward'
  | 'once-pingpong'
  | 'loop-forward'
  | 'loop-backward'
  | 'loop-pingpong';

export type ParticleSizeMode = 'manual' | 'auto';

/** Defold offset from the centered geometry: positive X right, positive Y up. */
export interface ParticlePivot {
  x: number;
  y: number;
}

/** Animation reference dimensions in logical texture units. */
export interface AnimationSize {
  width: number;
  height: number;
}

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
