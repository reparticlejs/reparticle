import shaders from '../../simulation/shaders.json';

const vertex = `#version 300 es
precision highp float;
out vec2 vTexCoord;
void main() {
 vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
 vTexCoord = p;
 gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
export interface Binding {
  name: string;
  index: number;
  location: WebGLUniformLocation | null;
  size: WebGLUniformLocation | null;
  dim: WebGLUniformLocation | null;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  unit?: number;
}
export interface SharedProgram {
  program: WebGLProgram;
  users: number;
  bindings: Binding[];
  birthPass: WebGLUniformLocation | null;
  birthState: WebGLUniformLocation | null;
  dimensions: WebGLUniformLocation | null;
  textureSize: WebGLUniformLocation | null;
  constants: (WebGLUniformLocation | null)[];
  width?: number;
  height?: number;
  capacity?: number;
  birthSamplerSet?: boolean;
  pass?: number;
}
// Programs belong to a context and are released after their last simulation.
const programs = new WeakMap<WebGL2RenderingContext, SharedProgram>();

export function acquireProgram(gl: WebGL2RenderingContext): SharedProgram {
  if (gl.isContextLost()) {
    throw new Error('Cannot create a simulation on a lost WebGL context');
  }
  let shared = programs.get(gl);
  // Restoring a context invalidates all its old program objects.
  if (!shared || !gl.isProgram(shared.program)) {
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Program allocation failed');
    }
    try {
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, shaders.fragment],
      ] as const) {
        const shader = gl.createShader(type);
        if (!shader) {
          throw new Error('Shader allocation failed');
        }
        try {
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compilation failed');
          }
          gl.attachShader(program, shader);
        } finally {
          gl.deleteShader(shader);
        }
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? 'Program linking failed');
      }
      shared = {
        program,
        users: 0,
        bindings: Object.keys(shaders.arguments).map((name, index) => ({
          name,
          index,
          location: gl.getUniformLocation(program, 'user_' + name),
          size: gl.getUniformLocation(program, 'user_' + name + 'Size'),
          dim: gl.getUniformLocation(program, 'user_' + name + 'Dim'),
        })),
        birthPass: gl.getUniformLocation(program, 'birthPass'),
        birthState: gl.getUniformLocation(program, 'birthState'),
        dimensions: gl.getUniformLocation(program, 'uOutputDim'),
        textureSize: gl.getUniformLocation(program, 'uTexSize'),
        constants: ['width', 'rows', 'capacity'].map((name) =>
          gl.getUniformLocation(program, 'constants_' + name),
        ),
      };
      const block = gl.getUniformBlockIndex(program, 'SimulationInputs');
      gl.uniformBlockBinding(program, block, 0);
      programs.set(gl, shared);
    } catch (error) {
      gl.deleteProgram(program);
      throw error;
    }
  }
  shared.users++;
  return shared;
}

export function releaseProgram(gl: WebGL2RenderingContext, shared: SharedProgram | null) {
  if (!shared || --shared.users !== 0) {
    return;
  }
  if (programs.get(gl) === shared) {
    programs.delete(gl);
  }
  if (gl.isProgram(shared.program)) {
    gl.deleteProgram(shared.program);
  }
}
