import type { AnimationPlayback } from '@reparticle/pixi';

/** Fixed scene and artwork selection; effect parameters stay in public JSON files. */
export interface Example {
  id: string;
  name: string;
  file: string;
  /** Emitter origin as a fraction of canvas height; defaults to 0.5. */
  verticalPosition?: number;
  /** Stretch box emission across the canvas width on resize. */
  fullWidth?: boolean;
  /** Demo-only display-object movement; simulation stays unchanged. */
  motion?: 'figure-eight' | 'pendulum';
  /** Tap the canvas to request particles at the pointer position. */
  manualBurst?: { emitter: string; count: number };
  artwork: Record<
    string,
    {
      source: string;
      frame?: string;
      /** Named Pixi spritesheet animation; playback stays in renderer configuration. */
      animation?: string;
      playback?: AnimationPlayback;
      fps?: number;
    }
  >;
}
