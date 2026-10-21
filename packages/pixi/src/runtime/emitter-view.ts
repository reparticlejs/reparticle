import type { StopOptions, EffectTransform } from '@reparticle/core';
import { Emitter, type EmitterConfig, type ModifierConfig } from '@reparticle/core';
import {
  GlProgram,
  Shader,
  State,
  RenderContainer,
  type Texture,
  type BufferImageSource,
  type WebGLRenderer,
  type Matrix,
} from 'pixi.js';

import { ParticleOrderBuffer } from '../rendering/order-buffer';
import { resolveTint } from '../rendering/resolve-tint';
import { restoreDrawState } from '../rendering/restore-draw-state';
import { restoreSimulationState } from '../rendering/restore-simulation-state';
import { applyState } from '../rendering/state';
import { createUniforms } from '../rendering/uniforms';
import { vertex, fragment } from '../shaders/particle';
import { createFrameSource } from '../textures/create-frame-source';
import { resolveFlipbook } from '../textures/resolve-flipbook';
import { resolvePivot } from '../textures/resolve-pivot';
import { resolveTexture } from '../textures/resolve-texture';
import { resolveTextureFlip } from '../textures/resolve-texture-flip';
import type { Flipbook } from '../types/flipbook';
import type { ParticleRendering, ParticleTint } from '../types/particle-rendering';
import type { ParticleTexture, ParticlePivot } from '../types/particle-texture';

/** WebGL2 particle draw resources; Pixi owns the render target and clipping state. */
export class EmitterView extends RenderContainer {
  public readonly emitter: Emitter;
  private readonly host: WebGLRenderer;
  private readonly gl: WebGL2RenderingContext;
  private readonly shader: Shader;
  private readonly state = State.for2d();
  private readonly order: ParticleOrderBuffer;
  private readonly uniforms: ReturnType<typeof createUniforms>;
  private disposed = false;
  private flipbook: Flipbook | null = null;
  private automaticSize = false;
  private readonly defaultTint: ParticleTint;
  private currentTint: ParticleTint;

  private textureFlip: [number, number] = [1, 1];
  private texturePivot: ParticlePivot = { x: 0, y: 0 };
  private frameSource: BufferImageSource | null = null;
  private animationHalfStep = 0;
  private artwork: Texture | null = null;
  public constructor(
    renderer: WebGLRenderer,
    config: EmitterConfig,
    options: ParticleRendering = { texture: null },
    sharedModifiers?: ModifierConfig[],
    effectTransform?: EffectTransform,
  ) {
    const tint = resolveTint(options.tint);
    const pivot = resolvePivot(options.pivot);
    const flip = resolveTextureFlip(options);
    const animation = resolveFlipbook(options);
    const texture = animation ? animation.frames[0]! : resolveTexture(options);
    super({});
    this.defaultTint = tint;
    this.currentTint = tint;
    this.artwork = texture;
    this.texturePivot = pivot;
    this.textureFlip = flip;
    this.automaticSize = options.sizeMode === 'auto' && (animation?.frames.length ?? 0) > 1;
    this.host = renderer;
    this.uniforms = createUniforms(config);
    const gl = renderer.gl;
    this.gl = gl;
    try {
      this.emitter = new Emitter(
        { gl, canvas: renderer.canvas },
        config,
        sharedModifiers,
        effectTransform,
      );
      let shader: Shader | undefined;
      let order: ParticleOrderBuffer | undefined;
      try {
        shader = new Shader({
          glProgram: GlProgram.from({ vertex, fragment, name: 'reparticle' }),
          resources: { particleUniforms: this.uniforms },
        });
        this.shader = shader;
        // Pixi compiles lazily. Bind here so construction still reports shader errors.
        renderer.shader.bind(shader);
        order = new ParticleOrderBuffer(renderer, this.emitter.capacity);
        this.order = order;
        if (animation) {
          this.frameSource = createFrameSource(
            animation.frames,
            gl.getParameter(gl.MAX_TEXTURE_SIZE),
          );
          this.flipbook = animation;
        }
      } catch (error) {
        order?.destroy();
        shader?.destroy();
        this.frameSource?.destroy();
        this.emitter.destroy();
        throw error;
      }
    } finally {
      restoreSimulationState(renderer);
    }
  }

  public getTint(): ParticleTint {
    return { ...this.currentTint };
  }

  public setTint(tint: ParticleTint): void {
    this.currentTint = resolveTint(tint);
  }

  public resetTint(): void {
    this.currentTint = this.defaultTint;
  }
  /** Caller owns the texture. Atlas trim and rotation are respected. */
  public get texture(): Texture | null {
    return this.artwork;
  }
  public set texture(value: Texture | null) {
    this.setTexture({ texture: value });
  }
  public setTexture(options: ParticleTexture): void {
    const pivot = resolvePivot(options.pivot);
    const flip = resolveTextureFlip(options);
    const flipbook = resolveFlipbook(options);
    const texture = flipbook ? flipbook.frames[0]! : resolveTexture(options);
    const frames = flipbook
      ? createFrameSource(flipbook.frames, this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE))
      : null;
    this.frameSource?.destroy();
    this.frameSource = frames;
    this.flipbook = flipbook;
    this.texturePivot = pivot;
    this.textureFlip = flip;
    this.automaticSize = options.sizeMode === 'auto' && (flipbook?.frames.length ?? 0) > 1;
    this.artwork = texture;
  }
  public update(dt: number): void {
    try {
      this.emitter.update(dt);
      if (dt > 0 && Number.isFinite(dt)) {
        this.animationHalfStep = dt * 0.5;
      }
    } finally {
      restoreSimulationState(this.host);
    }
  }
  public play(): void {
    try {
      this.emitter.play();
      this.animationHalfStep = 0;
    } finally {
      restoreSimulationState(this.host);
    }
  }

  public stop(options: StopOptions): void {
    try {
      this.emitter.stop(options);
    } finally {
      restoreSimulationState(this.host);
    }
  }

  public reset(): void {
    try {
      this.emitter.reset();
      this.animationHalfStep = 0;
    } finally {
      restoreSimulationState(this.host);
    }
  }
  public renderParticles(transform: Matrix, opacity: number): void {
    if (this.disposed || this.emitter.state === 'sleeping') {
      return;
    }
    const gl = this.gl,
      r = this.host,
      u = this.uniforms.uniforms;
    try {
      const count = this.order.update(this.emitter);
      u.textureFlip.set(this.textureFlip);
      u.particlePivot[0] = this.texturePivot.x;
      u.particlePivot[1] = this.texturePivot.y;
      u.automaticSize = this.automaticSize ? 1 : 0;
      const animation = this.flipbook;
      if (this.frameSource) {
        r.texture.bind(this.frameSource, 2);
      } else {
        // Keep the sampler complete even when animation is disabled.
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.emitter.texture);
      }
      u.animationFrames = 2;
      u.frameCount = animation?.frames.length ?? 0;
      u.animationFps = animation?.fps ?? 0;
      u.animationHalfStep = this.animationHalfStep;
      u.animationOnce = animation?.once ? 1 : 0;
      u.animationBackward = animation?.backward ? 1 : 0;
      u.animationPingpong = animation?.pingpong ? 1 : 0;
      const texture = this.artwork;
      if (texture) {
        r.texture.bind(texture.source, 1);
      }
      u.artwork = 1;
      u.textured = texture ? 1 : 0;
      u.straightAlpha = texture?.source.alphaMode === 'no-premultiply-alpha' ? 1 : 0;
      if (texture) {
        const uv = texture.uvs;
        u.frameTop[0] = uv.x0;
        u.frameTop[1] = uv.y0;
        u.frameTop[2] = uv.x1;
        u.frameTop[3] = uv.y1;
        u.frameBottom[0] = uv.x3;
        u.frameBottom[1] = uv.y3;
        u.frameBottom[2] = uv.x2;
        u.frameBottom[3] = uv.y2;
        const trim = texture.trim;
        u.textureTrim[0] = trim ? trim.x / texture.orig.width : 0;
        u.textureTrim[1] = trim ? trim.y / texture.orig.height : 0;
        u.textureTrim[2] = trim ? trim.width / texture.orig.width : 1;
        u.textureTrim[3] = trim ? trim.height / texture.orig.height : 1;
        const longest = Math.max(texture.orig.width, texture.orig.height);
        u.particleAspect[0] = animation?.aspect.x ?? texture.orig.width / longest;
        u.particleAspect[1] = animation?.aspect.y ?? texture.orig.height / longest;
      } else {
        u.particleAspect[0] = 1;
        u.particleAspect[1] = 1;
        u.textureTrim[0] = 0;
        u.textureTrim[1] = 0;
        u.textureTrim[2] = 1;
        u.textureTrim[3] = 1;
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.emitter.texture);
      u.particles = 0;
      u.width = this.emitter.width;
      u.rows = this.emitter.rows;
      const localSpace = this.emitter.space === 'local';
      u.stretchWithVelocity = this.emitter.stretchWithVelocity ? 1 : 0;
      u.emitterScale = localSpace ? this.emitter.worldScale : 1;
      u.emitterHandedness = localSpace ? this.emitter.worldHandedness : 1;
      const radians = localSpace ? (-this.emitter.worldRotation * Math.PI) / 180 : 0;
      u.emitterRotation[0] = Math.cos(radians);
      u.emitterRotation[1] = Math.sin(radians);
      u.emitterOffset[0] = localSpace ? this.emitter.worldX : 0;
      u.emitterOffset[1] = localSpace ? this.emitter.worldY : 0;
      const t = transform,
        m = u.transform;
      m[0] = t.a;
      m[1] = t.b;
      m[2] = 0;
      m[3] = t.c;
      m[4] = t.d;
      m[5] = 0;
      m[6] = t.tx;
      m[7] = t.ty;
      m[8] = 1;

      u.opacity = opacity;
      const tint = this.currentTint;
      u.tint[0] = tint.red;
      u.tint[1] = tint.green;
      u.tint[2] = tint.blue;
      u.tint[3] = tint.alpha;
      // Bind after updating values. Sampler uniforms select our manually bound
      // texture units; only the particle-state texture remains owned by GPU.js.
      r.shader.bind(this.shader);
      applyState(r, this.state, this.emitter.configuration.blendMode);
      r.geometry.bind(this.order.geometry, this.shader.glProgram);
      r.geometry.draw('triangle-strip', 4, 0, count);
    } finally {
      restoreDrawState(r);
    }
  }
  public override destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.emitter.destroy();
    this.order.destroy();
    this.frameSource?.destroy();
    // GlProgram.from() is shared; Pixi owns the compiled program cache.
    this.shader.destroy();
    restoreSimulationState(this.host);
    super.destroy();
  }
}
