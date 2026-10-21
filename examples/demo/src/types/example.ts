/** Fixed scene and artwork selection; effect parameters stay in public JSON files. */
export interface Example {
  id: string;
  name: string;
  file: string;
  /** Emitter origin as a fraction of canvas height; defaults to 0.5. */
  verticalPosition?: number;
  /** Stretch box emission across the canvas width on resize. */
  fullWidth?: boolean;
  artwork: Record<string, { source: string; frame?: string }>;
}
