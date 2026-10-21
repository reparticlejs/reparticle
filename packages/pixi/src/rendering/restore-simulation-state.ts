import type { WebGLRenderer } from 'pixi.js';

/**
 * Return the shared WebGL context to Pixi after GPU.js uses it.
 * GPU.js changes GL state directly, without updating Pixi's cached bindings.
 *
 * Call after simulation initialization, updates, or cleanup, before Pixi resumes
 * rendering. Particle draws use Pixi's encoder and do not need this reset.
 * This resets renderer state; it does not restore a saved filter or mask stack.
 */
export function restoreSimulationState(renderer: WebGLRenderer): void {
  const gl = renderer.gl;

  // GPU.js clips to its simulation texture. Pixi's reset does not disable this test.
  gl.disable(gl.SCISSOR_TEST);

  // Discard cached bindings and let Pixi restore its renderer state.
  renderer.resetState();
}
