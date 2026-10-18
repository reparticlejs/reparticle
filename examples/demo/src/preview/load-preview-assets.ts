import { parseEffectConfig } from '@reparticle/core';
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
  return {
    star: { atlas, frame: 'star' },
    leaf: { atlas, frame: 'leaf' },
    spark: { atlas, frame: 'spark' },
    procedural: { texture: null },
  };
}
