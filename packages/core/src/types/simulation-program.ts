/** Input order and cached texture-unit assignment for the shared shader. */
export interface SimulationBinding {
  name: string;
  index: number;
  location: WebGLUniformLocation | null;
  unit?: number;
}
/** Linked shader and uniform values shared by simulations in the same WebGL context. */
export interface SharedSimulationProgram {
  program: WebGLProgram;
  users: number;
  bindings: SimulationBinding[];
  birthPass: WebGLUniformLocation | null;
  birthState: WebGLUniformLocation | null;
  constants: (WebGLUniformLocation | null)[];
  width?: number;
  height?: number;
  capacity?: number;
  birthSamplerSet?: boolean;
  pass?: number;
}
