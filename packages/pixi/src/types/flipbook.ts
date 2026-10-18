import type { Texture } from 'pixi.js';

export interface Flipbook {
  frames: Texture[];
  fps: number;
  once: boolean;
  backward: boolean;
  pingpong: boolean;
}
