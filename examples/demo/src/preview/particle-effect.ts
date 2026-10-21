import type { EmitterConfig, ModifierConfig } from '@reparticle/core';
import { ParticleEffect } from '@reparticle/pixi';
import type { Application, WebGLRenderer } from 'pixi.js';

import type { PreviewControls } from '../types/preview';
import type { PreviewAssets } from '../types/preview-scene';
import { applyControls } from './apply-controls';

/** Creates a configured view without transferring ownership to the stage. */
export function createParticleEffect(
  definition: EmitterConfig,
  textures: PreviewAssets['textures'],
  controls: PreviewControls,
  modifiers?: ModifierConfig[],
): ParticleEffect {
  const emitter = applyControls(definition, controls);
  const effect = { version: 1, emitters: [emitter], modifiers };
  return new ParticleEffect(effect, { ...textures[controls.texture], autoUpdate: false });
}

/** Keeps the old view intact until its replacement is ready and attached. */
export function replaceParticleEffect(
  app: Application<WebGLRenderer>,
  current: ParticleEffect,
  textures: PreviewAssets['textures'],
  controls: PreviewControls,
  definition: EmitterConfig,
  modifiers?: ModifierConfig[],
): ParticleEffect {
  const replacement = createParticleEffect(definition, textures, controls, modifiers);
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
