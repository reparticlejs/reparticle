import { type ParticleTexture, validateAnimationFrames } from '@reparticle/pixi';
import { Assets, type Spritesheet, type Texture } from 'pixi.js';

import type { Example } from '../types/example';
import type { ExampleArtwork } from '../types/example-artwork';

/**
 * Bind each emitter ID to its renderer artwork.
 * Pixi Assets owns and caches the loaded textures, so example switching can reuse them.
 * This loader neither clones nor unloads those shared assets.
 */
export async function loadArtwork(example: Example): Promise<Record<string, ParticleTexture>> {
  const artwork: Record<string, ParticleTexture> = {};
  for (const [emitterId, asset] of Object.entries(example.artwork)) {
    artwork[emitterId] = await loadEmitterArtwork(asset);
  }
  return artwork;
}

/** Resolve atlas selections first; otherwise load the source as a standalone image. */
async function loadEmitterArtwork(asset: ExampleArtwork): Promise<ParticleTexture> {
  const url = `${import.meta.env.BASE_URL}${asset.source}`;

  if (asset.animation) {
    const sheet = await Assets.load<Spritesheet>(url);
    return selectAnimation(sheet, asset.animation, asset);
  }

  if (asset.frame) {
    const sheet = await Assets.load<Spritesheet>(url);
    const texture = sheet.textures[asset.frame];
    if (!texture) {
      throw new Error(`Missing frame ${asset.frame} in ${asset.source}`);
    }
    return { textures: [texture] };
  }

  const texture = await Assets.load<Texture>(url);
  return { textures: [texture] };
}

/** Validate frame compatibility before handing the sequence to ParticleEffect. */
function selectAnimation(sheet: Spritesheet, name: string, asset: ExampleArtwork): ParticleTexture {
  const textures = sheet.animations[name];
  if (!textures) {
    throw new Error(`Missing animation ${name} in ${asset.source}`);
  }
  validateAnimationFrames(textures);
  return { textures, playback: asset.playback, fps: asset.fps };
}
