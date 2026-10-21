import { type ParticleTexture, validateAnimationFrames } from '@reparticle/pixi';
import { Assets, type Spritesheet, type Texture } from 'pixi.js';

import type { Example } from './types/example';

/** Resolve static sprites or named atlas animations using Pixi's asset cache. */
export async function loadArtwork(example: Example): Promise<Record<string, ParticleTexture>> {
  const artwork: Record<string, ParticleTexture> = {};
  for (const [id, asset] of Object.entries(example.artwork)) {
    const source = `${import.meta.env.BASE_URL}${asset.source}`;
    if (asset.animation) {
      const sheet = await Assets.load<Spritesheet>(source);
      const textures = sheet.animations[asset.animation];
      if (!textures) {
        throw new Error(`Missing animation ${asset.animation} in ${asset.source}`);
      }
      validateAnimationFrames(textures);
      artwork[id] = { textures, playback: asset.playback, fps: asset.fps };
    } else if (asset.frame) {
      const sheet = await Assets.load<Spritesheet>(source);
      const texture = sheet.textures[asset.frame];
      if (!texture) {
        throw new Error(`Missing frame ${asset.frame} in ${asset.source}`);
      }
      artwork[id] = { textures: [texture] };
    } else {
      const texture = await Assets.load<Texture>(source);
      artwork[id] = { textures: [texture] };
    }
  }
  return artwork;
}
