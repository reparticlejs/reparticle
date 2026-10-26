import shaders from '#simulation/shaders.json';
import type { SharedSimulationProgram } from '#types/simulation-program.js';

// Programs belong to a context and are released after their last simulation.
const programs = new WeakMap<WebGL2RenderingContext, SharedSimulationProgram>();

export function acquireSimulationProgram(gl: WebGL2RenderingContext): SharedSimulationProgram {
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
        [gl.VERTEX_SHADER, shaders.vertex],
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
          // Other inputs are packed into SimulationInputs, not standalone uniforms.
          location:
            name === 'state' || name === 'spawnMask'
              ? gl.getUniformLocation(program, 'user_' + name)
              : null,
        })),
        birthPass: gl.getUniformLocation(program, 'birthPass'),
        birthState: gl.getUniformLocation(program, 'birthState'),
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

export function releaseSimulationProgram(
  gl: WebGL2RenderingContext,
  shared: SharedSimulationProgram | null,
) {
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
