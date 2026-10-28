/**
 * Renderer-owned resources borrowed by an emitter's GPU simulation.
 * Simulation and rendering share a context so particle textures can be consumed
 * directly on the GPU. Destroying the emitter does not destroy these resources.
 */
export interface EmitterContext {
  /** Shared WebGL2 context; simulation requires EXT_color_buffer_float support. */
  gl: WebGL2RenderingContext;

  /** Canvas belonging to gl; borrowed and never resized by the simulation. */
  canvas: HTMLCanvasElement;

  /** Optional host guard, called before simulation operations mutate CPU or GPU state. */
  assertAvailable?: () => void;

  /** Restore the host's graphics state after GPU work, including failures, before notifications. */
  restoreState?: () => void;
}

/** Borrowed simulation output; owned by the simulation, never a CPU snapshot. */
export interface PipelineTexture {
  /** Particle-state storage, used directly by the next kernel or renderer. */
  texture: WebGLTexture;

  /** The same context supplied through EmitterContext.gl. */
  context: WebGL2RenderingContext;
}
