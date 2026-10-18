import type { WebGLRenderer } from 'pixi.js';

/** Invalidate only the systems touched by our draw; keep target and mask stacks intact. */
export function restoreDrawState(renderer: WebGLRenderer): void {
  renderer.geometry.resetState();
  renderer.shader.resetState();
  renderer.texture.resetState();
  renderer.state.resetState();
}
