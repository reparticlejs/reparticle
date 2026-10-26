import { Texture } from 'pixi.js';

import type { Flipbook } from '#types/flipbook.js';
import type {
  AnimationFrames,
  AnimationPlayback,
  AnimationSize,
  ParticleTexture,
  UnvalidatedArtwork,
} from '#types/particle-texture.js';

/**
 * Resolve a texture sequence into frame references and vertex-shader settings.
 * Returns null for a static texture selection. Size mode is checked for both paths.
 *
 * This prepares playback; it does not advance it. The shader chooses each particle's
 * frame from its age. Once playback spans particle lifetime; looping uses FPS.
 * The returned frame list is copied, but its textures remain owned by the caller.
 */
export function resolveFlipbook(options: UnvalidatedArtwork): Flipbook | null {
  validateSizeMode(options.sizeMode);
  const frames = options.textures;
  if (frames !== undefined) {
    if (
      !Array.isArray(frames) ||
      frames.length === 0 ||
      frames.some((frame) => !(frame instanceof Texture))
    ) {
      throw new Error('Particle textures must be a nonempty array of Pixi textures');
    }
  }
  if (!frames || frames.length === 1) {
    if (
      options.playback !== undefined ||
      options.fps !== undefined ||
      options.animationSize !== undefined
    ) {
      throw new Error('Animation settings require at least two textures');
    }
    return null;
  }
  validateAnimationFrames(frames);
  const aspect = resolveAspect(options.animationSize ?? frames[0].orig);
  const fps = options.fps ?? 30;
  if (!Number.isFinite(fps) || fps < 0) {
    throw new Error('Particle animation FPS must be finite and nonnegative');
  }

  const playback = options.playback ?? 'loop-forward';
  const playbackFlags = resolvePlaybackFlags(playback);

  return {
    // Disabled playback displays the first authored frame, regardless of particle age.
    frames: playback === 'none' ? [frames[0]] : [...frames],
    aspect,
    fps,
    ...playbackFlags,
  };
}

function validateSizeMode(sizeMode: ParticleTexture['sizeMode']): void {
  if (sizeMode !== undefined && sizeMode !== 'manual' && sizeMode !== 'auto') {
    throw new Error(`Unknown particle size mode: ${String(sizeMode)}`);
  }
}

/** Validate loaded arrays and narrow them for animation bindings. Textures stay caller-owned. */
export function validateAnimationFrames(
  frames: readonly Texture[],
): asserts frames is AnimationFrames {
  if (frames.length < 2 || frames.some((frame) => !(frame instanceof Texture))) {
    throw new Error('Particle animation requires at least two Pixi textures');
  }
  const source = frames[0]!.source;
  if (frames.some((frame) => frame.source !== source)) {
    throw new Error('Particle animation frames must share one texture source');
  }
}

/** Normalize reference dimensions so the longest side is 1; playback order cannot change them. */
function resolveAspect({ width, height }: AnimationSize): Flipbook['aspect'] {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Particle animation dimensions must be finite and positive');
  }

  const longestSide = Math.max(width, height);
  return { x: width / longestSide, y: height / longestSide };
}

/** Explicit shader flags also reject unsupported playback values passed by JavaScript callers. */
function resolvePlaybackFlags(
  playback: AnimationPlayback,
): Pick<Flipbook, 'once' | 'backward' | 'pingpong'> {
  switch (playback) {
    case 'none':
    case 'loop-forward':
      return { once: false, backward: false, pingpong: false };
    case 'once-forward':
      return { once: true, backward: false, pingpong: false };
    case 'once-backward':
      return { once: true, backward: true, pingpong: false };
    case 'once-pingpong':
      return { once: true, backward: false, pingpong: true };
    case 'loop-backward':
      return { once: false, backward: true, pingpong: false };
    case 'loop-pingpong':
      return { once: false, backward: false, pingpong: true };
    default:
      throw new Error(`Unknown particle animation playback: ${String(playback)}`);
  }
}
