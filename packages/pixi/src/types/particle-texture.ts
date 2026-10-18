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

/** Caller owns the textures, including frames loaded by a Pixi Spritesheet. */
export type ParticleTexture = { sizeMode?: ParticleSizeMode } & (
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
      playback?: AnimationPlayback;
      fps?: number;
      texture?: never;
      frame?: never;
    }
);
