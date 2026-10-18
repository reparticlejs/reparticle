import type { Texture } from 'pixi.js';

/** Caller owns the textures, including frames loaded by a Pixi Spritesheet. */
export type ParticleTexture =
  | { texture: Texture | null; atlas?: never; frame?: never }
  | { atlas: { textures: Record<string, Texture> }; frame: string; texture?: never };
