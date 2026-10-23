import type { ExampleArtwork } from './example-artwork';

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
