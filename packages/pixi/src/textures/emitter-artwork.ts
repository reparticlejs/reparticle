import { Texture, type BufferImageSource, type Shader } from 'pixi.js';

import type { createUniforms } from '#rendering/uniforms.js';
import type { Flipbook } from '#types/flipbook.js';
import type { ParticleTexture, ParticlePivot } from '#types/particle-texture.js';

import { createAnimationFrameSource } from './create-animation-frame-source';
import { resolveFlipbook } from './resolve-flipbook';
import { resolvePivot } from './resolve-pivot';
import { resolveTexture } from './resolve-texture';
import { resolveTextureFlip } from './resolve-texture-flip';

/**
 * Resolves one emitter's artwork and synchronizes its shader inputs.
 * Owns generated animation metadata, but never destroys caller-owned textures.
 */
export class EmitterArtwork {
  private currentTexture: Texture | null = null;
  private flipbook: Flipbook | null = null;
  private frameSource: BufferImageSource | null = null;
  private automaticSize = false;
  private textureFlip: [number, number] = [1, 1];
  private texturePivot: ParticlePivot = { x: 0, y: 0 };

  public constructor(
    private readonly maxTextureSize: number,
    options: ParticleTexture<Texture>,
  ) {
    this.setTexture(options);
  }

  public get texture(): Texture | null {
    return this.currentTexture;
  }

  /** Prepare replacement metadata before changing any current artwork state. */
  public setTexture(options: ParticleTexture<Texture>, shader?: Shader): void {
    const pivot = resolvePivot(options.pivot);
    const flip = resolveTextureFlip(options);
    const flipbook = resolveFlipbook(options);
    const texture = flipbook ? flipbook.frames[0]! : resolveTexture(options);
    const frames = flipbook
      ? createAnimationFrameSource(flipbook.frames, this.maxTextureSize)
      : null;
    // Detach metadata from the bind group before releasing its texture.
    // Keep the old binding intact if resolving replacement artwork fails.
    if (shader) {
      shader.resources.animationFrames = frames ?? Texture.EMPTY.source;
    }
    this.frameSource?.destroy();
    this.frameSource = frames;
    this.flipbook = flipbook;
    this.texturePivot = pivot;
    this.textureFlip = flip;
    this.automaticSize = options.sizeMode === 'auto' && (flipbook?.frames.length ?? 0) > 1;
    this.currentTexture = texture;
  }

  /** Reuse uniform storage; frame selection itself runs in the vertex shader. */
  public sync(
    shader: Shader,
    uniforms: ReturnType<typeof createUniforms>['uniforms'],
    halfStep: number,
  ): void {
    this.syncArtwork(shader, uniforms);
    this.syncAnimation(shader, uniforms, halfStep);
  }

  public destroy(): void {
    this.frameSource?.destroy();
    this.frameSource = null;
  }

  /** Read current texture geometry each draw so caller-owned atlas updates are respected. */
  private syncArtwork(
    shader: Shader,
    uniforms: ReturnType<typeof createUniforms>['uniforms'],
  ): void {
    uniforms.textureFlip.set(this.textureFlip);
    uniforms.particlePivot[0] = this.texturePivot.x;
    uniforms.particlePivot[1] = this.texturePivot.y;
    uniforms.automaticSize = this.automaticSize ? 1 : 0;
    const animation = this.flipbook;
    const texture = this.currentTexture;
    shader.resources.artwork = texture?.source ?? Texture.EMPTY.source;
    uniforms.textured = texture ? 1 : 0;
    uniforms.straightAlpha = texture?.source.alphaMode === 'no-premultiply-alpha' ? 1 : 0;
    if (texture) {
      const uv = texture.uvs;
      uniforms.frameTop[0] = uv.x0;
      uniforms.frameTop[1] = uv.y0;
      uniforms.frameTop[2] = uv.x1;
      uniforms.frameTop[3] = uv.y1;
      uniforms.frameBottom[0] = uv.x3;
      uniforms.frameBottom[1] = uv.y3;
      uniforms.frameBottom[2] = uv.x2;
      uniforms.frameBottom[3] = uv.y2;
      const trim = texture.trim;
      uniforms.textureTrim[0] = trim ? trim.x / texture.orig.width : 0;
      uniforms.textureTrim[1] = trim ? trim.y / texture.orig.height : 0;
      uniforms.textureTrim[2] = trim ? trim.width / texture.orig.width : 1;
      uniforms.textureTrim[3] = trim ? trim.height / texture.orig.height : 1;
      const longest = Math.max(texture.orig.width, texture.orig.height);
      uniforms.particleAspect[0] = animation?.aspect.x ?? texture.orig.width / longest;
      uniforms.particleAspect[1] = animation?.aspect.y ?? texture.orig.height / longest;
    } else {
      uniforms.particleAspect[0] = 1;
      uniforms.particleAspect[1] = 1;
      uniforms.textureTrim[0] = 0;
      uniforms.textureTrim[1] = 0;
      uniforms.textureTrim[2] = 1;
      uniforms.textureTrim[3] = 1;
    }
  }

  /** Bind frame metadata and playback parameters without advancing animation on the CPU. */
  private syncAnimation(
    shader: Shader,
    uniforms: ReturnType<typeof createUniforms>['uniforms'],
    halfStep: number,
  ): void {
    const animation = this.flipbook;
    shader.resources.animationFrames = this.frameSource ?? Texture.EMPTY.source;
    uniforms.frameCount = animation?.frames.length ?? 0;
    uniforms.animationFps = animation?.fps ?? 0;
    uniforms.animationHalfStep = halfStep;
    uniforms.animationOnce = animation?.once ? 1 : 0;
    uniforms.animationBackward = animation?.backward ? 1 : 0;
    uniforms.animationPingpong = animation?.pingpong ? 1 : 0;
  }
}
