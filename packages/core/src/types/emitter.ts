import type { Texture } from 'gpu.js';

/**
 * Renderer-owned resources borrowed by an emitter's GPU simulation.
 * Simulation and rendering share a context so particle textures can be consumed
 * directly on the GPU. Destroying the emitter does not destroy these resources.
 */
export interface EmitterContext {
  /** Shared WebGL2 context; simulation requires EXT_color_buffer_float support. */
  gl: WebGL2RenderingContext;

  /** Canvas belonging to gl, passed to GPU.js and preserved across kernel compilation. */
  canvas: HTMLCanvasElement;
}

/**
 * GPU.js pipeline output with the WebGL handles required by the simulation.
 * isPipelineTexture() checks that an output belongs to the expected context.
 *
 * The simulation owns this texture and reuses its storage on later steps.
 * Consumers borrow the current handle; it is not a persistent particle snapshot
 * and must not be deleted by the renderer. Reading its handle performs no readback.
 */
export interface PipelineTexture extends Texture {
  /** Particle-state storage, used directly by the next kernel or renderer. */
  texture: WebGLTexture;

  /** The same context supplied through EmitterContext.gl. */
  context: WebGL2RenderingContext;
}
