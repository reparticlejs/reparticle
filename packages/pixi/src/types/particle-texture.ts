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
export type AnimationFrames = readonly [Texture, Texture, ...Texture[]];

/** Borrowed artwork. One frame is static; two or more enable animation settings. */
export type ParticleTexture = {
  sizeMode?: ParticleSizeMode | undefined;
  pivot?: ParticlePivot | undefined;
  flipX?: boolean | undefined;
  flipY?: boolean | undefined;
} & (
  | {
      textures?: readonly [Texture] | undefined;
      animationSize?: never;
      playback?: never;
      fps?: never;
    }
  | {
      textures: AnimationFrames;
      /** Defaults to the first authored frame's original size. */
      animationSize?: AnimationSize | undefined;
      playback?: AnimationPlayback | undefined;
      fps?: number | undefined;
    }
);
