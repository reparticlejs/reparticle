export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  /** Reflect local X before rotation when -1. */
  handedness: 1 | -1;
}
