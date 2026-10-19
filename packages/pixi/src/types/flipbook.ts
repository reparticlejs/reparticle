import type { Texture } from 'pixi.js';

export interface Flipbook {
  frames: Texture[];
  aspect: { x: number; y: number };
  fps: number;
  once: boolean;
  backward: boolean;
  pingpong: boolean;
}
