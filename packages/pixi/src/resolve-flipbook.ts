import type { Flipbook } from './types/flipbook';
import type { ParticleTexture } from './types/particle-texture';

export function resolveFlipbook(options: ParticleTexture): Flipbook | null {
  if (options.animation === undefined) {
    return null;
  }
  const frames = Object.hasOwn(options.atlas.animations, options.animation)
    ? options.atlas.animations[options.animation]
    : undefined;
  if (!frames?.length) {
    throw new Error(`Unknown or empty particle animation: ${options.animation}`);
  }
  if (frames.some((frame) => frame.source !== frames[0]!.source)) {
    throw new Error('Particle animation frames must share one texture source');
  }
  const fps = options.fps ?? 30;
  if (!Number.isFinite(fps) || fps < 0) {
    throw new Error('Particle animation FPS must be finite and nonnegative');
  }
  const playback = options.playback ?? 'loop-forward';
  if (
    ![
      'none',
      'once-forward',
      'once-backward',
      'once-pingpong',
      'loop-forward',
      'loop-backward',
      'loop-pingpong',
    ].includes(playback)
  ) {
    throw new Error(`Unknown particle animation playback: ${playback}`);
  }
  return {
    frames: playback === 'none' ? [frames[0]!] : [...frames],
    fps,
    once: playback.startsWith('once-'),
    backward: playback.endsWith('-backward'),
    pingpong: playback.endsWith('-pingpong'),
  };
}
