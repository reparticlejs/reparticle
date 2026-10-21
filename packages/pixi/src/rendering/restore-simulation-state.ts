import type { WebGLRenderer } from 'pixi.js';

/** GPU.js enables a scissor sized to its simulation texture; Pixi does not reset it. */
export function restoreSimulationState(renderer: WebGLRenderer): void {
  renderer.gl.disable(renderer.gl.SCISSOR_TEST);
  renderer.resetState();
}
