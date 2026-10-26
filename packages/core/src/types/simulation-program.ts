/** Input order and cached texture-unit assignment for the shared shader. */
export interface SimulationBinding {
  name: string;
  /** Position in SimulationInputs.args, including uniform-buffer inputs. */
  index: number;
  /** Sampler location; null for inputs stored in the uniform buffer. */
  location: WebGLUniformLocation | null;
  /** Last texture unit assigned to this sampler; undefined before its first upload. */
  unit?: number;
}
/** Linked shader and uniform values shared by simulations in the same WebGL context. */
export interface SharedSimulationProgram {
  program: WebGLProgram;
  /** Outstanding acquisitions; zero permits deleting the program. */
  users: number;
  bindings: SimulationBinding[];
  /** Selects birth-data writes (1) or changing-state updates (0). */
  birthPass: WebGLUniformLocation | null;
  /** Sampler for the separate birth-data texture. */
  birthState: WebGLUniformLocation | null;
  widthLocation: WebGLUniformLocation | null;
  /** Number of particle rows per band, not the full texture height. */
  rowsLocation: WebGLUniformLocation | null;
  capacityLocation: WebGLUniformLocation | null;
  // Last uploaded dimensions; shared because uniform values belong to the program.
  uploadedWidth?: number;
  /** Full changing-state texture height: two particle bands. */
  uploadedHeight?: number;
  uploadedCapacity?: number;
  /** Whether birthState has been assigned its fixed texture unit. */
  birthSamplerSet?: boolean;
  /** Last uploaded birthPass value; undefined forces the first upload. */
  pass?: number;
}

/** Generated std140 location and storage size for one simulation input. */
export interface SimulationUniformLayout {
  offset: number;
  length: number;
  padded: number;
}

/** Owned texture and its permanent framebuffer attachment. */
export interface SimulationTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  height: number;
}
