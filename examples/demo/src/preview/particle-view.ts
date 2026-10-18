import type { EmitterConfig, ModifierConfig } from '@reparticle/core';
import { ParticleView } from '@reparticle/pixi';
import type { Application, WebGLRenderer } from 'pixi.js';

import type { PreviewControls } from '../types/preview';
import type { PreviewAssets } from '../types/preview-scene';
import { applyControls } from './apply-controls';

/** Creates a configured view without transferring ownership to the stage. */
export function createParticleView(
  app: Application<WebGLRenderer>,
  definition: EmitterConfig,
  textures: PreviewAssets['textures'],
  controls: PreviewControls,
  modifiers?: ModifierConfig,
): ParticleView {
  const emitter = applyControls(definition, controls);
  const effect = { version: 1, emitters: [emitter], modifiers };
  const renderer = app.renderer;
  return new ParticleView(renderer, effect, textures[controls.texture]);
}

/** Keeps the old view intact until its replacement is ready and attached. */
export function replaceParticleView(
  app: Application<WebGLRenderer>,
  current: ParticleView,
  textures: PreviewAssets['textures'],
  controls: PreviewControls,
  definition: EmitterConfig,
  modifiers?: ModifierConfig,
): ParticleView {
  const replacement = createParticleView(app, definition, textures, controls, modifiers);
  try {
    replacement.emitter.x = current.emitter.x;
    replacement.emitter.y = current.emitter.y;
    replacement.emitter.emitting = current.emitter.emitting;
    app.stage.addChildAt(replacement, app.stage.getChildIndex(current));
  } catch (error) {
    replacement.destroy();
    throw error;
  }
  app.stage.removeChild(current);
  current.destroy();
  return replacement;
}
