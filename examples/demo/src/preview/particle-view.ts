import type { EmitterConfig } from '@reparticle/core';
import { ParticleView } from '@reparticle/pixi';
import type { Application, WebGLRenderer } from 'pixi.js';

import type { PreviewControls } from '../types/preview';
import type { PreviewAssets } from '../types/preview-scene';
import { applyControls } from './apply-controls';

/** Creates a configured view without transferring ownership to the stage. */
export function createParticleView(
  app: Application,
  definition: EmitterConfig,
  textures: PreviewAssets['textures'],
  controls: PreviewControls,
): ParticleView {
  const emitter = applyControls(definition, controls);
  const effect = { version: 1, emitters: [emitter] };
  const renderer = app.renderer as WebGLRenderer;
  const view = new ParticleView(renderer, effect);
  try {
    view.texture = textures[controls.texture];
    view.particleSize = controls.size;
    return view;
  } catch (error) {
    view.destroy();
    throw error;
  }
}

/** Keeps the old view intact until its replacement is ready and attached. */
export function replaceParticleView(
  app: Application,
  current: ParticleView,
  textures: PreviewAssets['textures'],
  controls: PreviewControls,
): ParticleView {
  const replacement = createParticleView(app, current.emitter.configuration, textures, controls);
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
