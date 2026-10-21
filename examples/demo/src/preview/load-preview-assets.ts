import { parseEffectConfig } from '@reparticle/core';
import { validateAnimationFrames } from '@reparticle/pixi';
import { Assets, type Spritesheet } from 'pixi.js';

import type { PreviewAssets } from '../types/preview-scene';

export async function loadPreviewAssets(signal: AbortSignal): Promise<PreviewAssets | null> {
  const effect = await loadEffect(signal);
  if (signal.aborted) {
    return null;
  }
  const textures = await loadTextures();
  if (signal.aborted) {
    return null;
  }
  return { effect, textures };
}

async function loadEffect(signal: AbortSignal): Promise<PreviewAssets['effect']> {
  const response = await fetch(`${import.meta.env.BASE_URL}effect.json`, { signal });
  if (!response.ok) {
    throw new Error(`Unable to load effect.json: ${response.status}`);
  }
  const definition: unknown = await response.json();
  return parseEffectConfig(definition);
}

async function loadTextures(): Promise<PreviewAssets['textures']> {
  const atlas = await Assets.load<Spritesheet>(
    `${import.meta.env.BASE_URL}textures/particles.json`,
  );
  const frames = atlas.animations.shapes!;
  validateAnimationFrames(frames);
  return {
    star: { textures: [atlas.textures.star!] },
    leaf: { textures: [atlas.textures.leaf!] },
    'leaf-pivot': { textures: [atlas.textures.leaf!], pivot: { x: 0, y: 0.5 } },
    spark: { textures: [atlas.textures.spark!] },
    flipbook: { textures: frames, playback: 'loop-forward', fps: 6 },
    'flipbook-auto': {
      textures: frames,
      playback: 'loop-forward',
      fps: 6,
      sizeMode: 'auto',
    },
    'flipbook-once': { textures: frames, playback: 'once-forward' },
    'flipbook-pingpong': { textures: frames, playback: 'loop-pingpong', fps: 6 },
    procedural: {},
  };
}
