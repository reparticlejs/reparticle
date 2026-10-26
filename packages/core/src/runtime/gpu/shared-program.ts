import shaders from '#simulation/shaders.json';
import type { SharedSimulationProgram } from '#types/simulation-program.js';

// Each borrowed WebGL context gets one linked simulation program. Individual
// simulations own their textures/buffers; this module owns only shaders/programs.
// The WeakMap does not keep the host renderer's context alive.
const programs = new WeakMap<WebGL2RenderingContext, SharedSimulationProgram>();

/**
 * Borrow the context's simulation program, compiling it on the first acquisition.
 * Each successful acquisition must have exactly one matching release. Compilation
 * failures leave no cached entry, so a later attempt can retry.
 *
 * The host (for example Pixi) owns the context; we never create or destroy it.
 */
export function acquireSimulationProgram(gl: WebGL2RenderingContext): SharedSimulationProgram {
  if (gl.isContextLost()) {
    throw new Error('Cannot create a simulation on a lost WebGL context');
  }
  let shared = programs.get(gl);
  // A restored context has the same JS identity but invalid GPU handles.
  // Recreate this program if needed; this does not restore particle textures.
  if (!shared || !gl.isProgram(shared.program)) {
    shared = createSimulationProgram(gl);
    programs.set(gl, shared);
  }

  shared.users++;
  return shared;
}

/**
 * Release one acquisition. Delete the GPU program only after its final owner exits.
 * Null supports cleanup after partially failed simulation initialization; releasing
 * the same non-null acquisition twice is not supported.
 */
export function releaseSimulationProgram(
  gl: WebGL2RenderingContext,
  shared: SharedSimulationProgram | null,
) {
  if (!shared || --shared.users !== 0) {
    return;
  }
  // A stale owner must not evict a newer program created after context restoration.
  if (programs.get(gl) === shared) {
    programs.delete(gl);
  }
  if (gl.isProgram(shared.program)) {
    gl.deleteProgram(shared.program);
  }
}

/**
 * Compile the generated GLSL, link both stages, and resolve their input locations.
 * The returned program starts with no owners; acquire publishes it only on success.
 * Every failure releases GPU resources before propagating the driver's error.
 */
function createSimulationProgram(gl: WebGL2RenderingContext): SharedSimulationProgram {
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Program allocation failed');
  }

  try {
    for (const [type, source] of [
      [gl.VERTEX_SHADER, shaders.vertex],
      [gl.FRAGMENT_SHADER, shaders.fragment],
    ] as const) {
      const shader = compileShader(gl, type, source);
      try {
        gl.attachShader(program, shader);
      } finally {
        // WebGL retains attached shaders until the program no longer needs them.
        gl.deleteShader(shader);
      }
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'Program linking failed');
    }

    // Locations are resolved once. Cached uniform values also belong here because
    // switching emitters does not reset values stored in the shared WebGL program.
    const shared: SharedSimulationProgram = {
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
      widthLocation: gl.getUniformLocation(program, 'constants_width'),
      rowsLocation: gl.getUniformLocation(program, 'constants_rows'),
      capacityLocation: gl.getUniformLocation(program, 'constants_capacity'),
    };
    // Associate the shader block with binding point 0. Before each update, the
    // simulation binds its own uniform buffer to that same point.
    const block = gl.getUniformBlockIndex(program, 'SimulationInputs');
    gl.uniformBlockBinding(program, block, 0);
    return shared;
  } catch (error) {
    // A failed program has no owner to release it later.
    gl.deleteProgram(program);
    throw error;
  }
}

/**
 * Ask the device driver to compile GLSL generated at build time. This is not
 * TypeGPU compilation. On success the caller must attach and delete the shader;
 * on failure this function deletes it and preserves the compiler's diagnostic.
 */
function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
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
    return shader;
  } catch (error) {
    gl.deleteShader(shader);
    throw error;
  }
}
