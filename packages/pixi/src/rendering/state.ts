import type { EmitterConfig } from '@reparticle/core';
import type { State, WebGLRenderer } from 'pixi.js';

/**
 * Apply Pixi's 2D draw state without touching render targets, masks, or clipping.
 * Blend mode names and factors match Pixi defaults directly.
 * The caller reuses its State and restores draw state after the particle draw.
 */
export function applyState(
  renderer: WebGLRenderer,
  state: State,
  blendMode: EmitterConfig['blendMode'],
): void {
  state.blendMode = blendMode;
  renderer.state.set(state);
}
