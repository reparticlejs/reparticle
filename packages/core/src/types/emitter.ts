import type { Texture } from "gpu.js";

export interface EmitterContext {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
}

export interface PipelineTexture extends Texture {
  texture: WebGLTexture;
  context: WebGL2RenderingContext;
}
