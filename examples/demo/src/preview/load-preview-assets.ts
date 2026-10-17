import { parseEffectConfig } from '@reparticle/core';
import { Assets, type Texture } from 'pixi.js';

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
  const base = import.meta.env.BASE_URL;
  const star = `${base}textures/star.svg`;
  const leaf = `${base}textures/leaf.svg`;
  const spark = `${base}textures/spark.svg`;
  const textures = await Assets.load<Texture>([star, leaf, spark]);
  return {
    star: textures[star]!,
    leaf: textures[leaf]!,
    spark: textures[spark]!,
    procedural: null,
  };
}
