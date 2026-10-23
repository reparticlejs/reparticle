import type { AnimationPlayback } from '@reparticle/pixi';

/** Fixed scene and artwork selection; effect parameters stay in public JSON files. */
export interface Example {
  id: string;
  name: string;
  file: string;
  /** Effect origin as a fraction of canvas height; defaults to 0.5. */
  verticalPosition?: number;
  /** Stretch box emission across the canvas width on resize. */
  fullWidth?: boolean;
  /** Stretch box emission across the canvas height on resize. */
  fullHeight?: boolean;
  /** Demo-only display-object movement; simulation stays unchanged. */
  motion?: 'figure-eight' | 'pendulum';
  /** Artwork keyed by emitter ID in the effect JSON. */
  artwork: Record<string, ExampleArtwork>;
}

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
}
