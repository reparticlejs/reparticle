import { parseEffectConfig } from '@reparticle/core';
import { Assets, type Texture } from 'pixi.js';

import type { PreviewAssets } from '../types/preview-scene';

export async function loadPreviewAssets(signal: AbortSignal): Promise<PreviewAssets | null> {
  const base = import.meta.env.BASE_URL;
  const response = await fetch(`${base}effect.json`, { signal });
  if (!response.ok) {
    throw new Error(`Unable to load effect.json: ${response.status}`);
  }
  const effect = parseEffectConfig(await response.json());
  if (signal.aborted) {
    return null;
  }

  const star = `${base}textures/star.svg`;
  const leaf = `${base}textures/leaf.svg`;
  const spark = `${base}textures/spark.svg`;
  const textures = await Assets.load<Texture>([star, leaf, spark]);
  if (signal.aborted) {
    return null;
  }
  return {
    effect,
    textures: {
      star: textures[star]!,
      leaf: textures[leaf]!,
      spark: textures[spark]!,
      procedural: null,
    },
  };
}
