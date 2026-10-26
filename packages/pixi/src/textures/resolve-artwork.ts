import { Texture } from 'pixi.js';

import type {
  AnimationFrames,
  ParticleTexture,
  UnvalidatedArtwork,
} from '#types/particle-texture.js';

import { getMissingTexture } from './missing-texture';

/**
 * Keep omitted artwork procedural and replace invalid supplied artwork with a placeholder.
 * A texture is usable only while both it and its source are alive.
 *
 * Returns the original options when no replacement is needed. resolveRendering uses
 * that identity to warn once per invalid assignment, after validating the other settings.
 * Caller-owned textures and arrays are never modified.
 */
export function resolveArtwork(options: UnvalidatedArtwork): UnvalidatedArtwork {
  const frames = options.textures;
  if (frames === undefined || hasUsableTextures(frames)) {
    return options;
  }

  const frameCount = Array.isArray(frames) ? frames.length : 0;
  if (frameCount > 1) {
    return { ...options, textures: createPlaceholderFrames(frameCount) };
  }
  return createStaticPlaceholder(options);
}

/** Check actual values too: JavaScript callers and loaded assets can bypass tuple types. */
function hasUsableTextures(frames: unknown): boolean {
  if (!Array.isArray(frames) || frames.length === 0) {
    return false;
  }
  for (const frame of frames) {
    if (!(frame instanceof Texture) || frame.destroyed || frame.source.destroyed) {
      return false;
    }
  }
  return true;
}

/**
 * Replace the entire animation so valid and missing frames cannot mix texture sources.
 * Preserve its frame count and playback timing; all entries borrow the same placeholder.
 * Called only for sequences with at least two frames.
 */
function createPlaceholderFrames(frameCount: number): AnimationFrames {
  const texture = getMissingTexture();
  const frames: [Texture, Texture, ...Texture[]] = [texture, texture];
  while (frames.length < frameCount) {
    frames.push(texture);
  }
  return frames;
}

/** A static fallback preserves sizing and placement, but cannot accept animation settings. */
function createStaticPlaceholder(options: UnvalidatedArtwork): ParticleTexture<Texture> {
  const hasAnimationSettings =
    options.playback !== undefined ||
    options.fps !== undefined ||
    options.animationSize !== undefined;
  if (hasAnimationSettings) {
    throw new Error('Animation settings require at least two textures');
  }

  return {
    textures: [getMissingTexture()],
    sizeMode: options.sizeMode,
    pivot: options.pivot,
    flipX: options.flipX,
    flipY: options.flipY,
  };
}
