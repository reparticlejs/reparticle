import type { Emitter, StopOptions } from '@reparticle/core';
import { color32BitToUniform, type Texture, type WebGLRenderer, type Matrix } from 'pixi.js';

import type { ParticleRendering, ParticleTint } from '#types/particle-rendering.js';
import type { ParticleTexture } from '#types/particle-texture.js';

import { resolveRendering } from '../config/resolve-rendering';
import { EmitterResources } from '../rendering/emitter-resources';
import { resolveTint } from '../rendering/resolve-tint';

/**
 * Draws one core emitter using Pixi resources and its current simulation texture.
 * Owns shader, geometry and frame metadata; borrows simulation and artwork textures.
 * Pixi owns the render target, clipping and inherited display-object state.
 */
export class EmitterRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly resources: EmitterResources;
  private disposed = false;
  private currentTint: ParticleTint;
  private blendMode: NonNullable<ParticleRendering['blendMode']>;
  private animationHalfStep = 0;

  public constructor(
    renderer: WebGLRenderer,
    public readonly emitter: Emitter,
    options: ParticleRendering = {},
  ) {
    this.currentTint = resolveTint(options.tint);
    this.renderer = renderer;
    const rendering = resolveRendering(options);
    this.blendMode = rendering.blendMode;
    this.resources = new EmitterResources(renderer, emitter, rendering);
  }

  /** Caller owns the texture. Atlas trim and rotation are respected. */
  public get texture(): Texture | null {
    return this.resources.artwork.texture;
  }

  public set texture(value: Texture | null) {
    this.setTexture(value ? { textures: [value] } : {});
  }

  public setBlendMode(blendMode: NonNullable<ParticleRendering['blendMode']>): void {
    this.blendMode = blendMode;
  }

  public setTint(tint: ParticleTint): void {
    this.currentTint = resolveTint(tint);
  }

  /** Validate and prepare replacement metadata before releasing the current frames. */
  public setTexture(options: ParticleTexture): void {
    this.resources.artwork.setTexture(options);
  }

  /** Advance simulation and retain its half-step for flipbook frame sampling. */
  public update(seconds: number): void {
    this.emitter.update(seconds);
    if (seconds > 0 && Number.isFinite(seconds)) {
      this.animationHalfStep = seconds * 0.5;
    }
  }

  public play(): void {
    this.emitter.play();
    this.animationHalfStep = 0;
  }

  public stop(options: StopOptions): void {
    this.emitter.stop(options);
  }

  public reset(): void {
    this.emitter.reset();
    this.animationHalfStep = 0;
  }

  /** Refresh reusable uniforms and submit one instanced quad draw. */
  public renderParticles(transform: Matrix, displayColor: number): void {
    if (this.disposed || this.emitter.state === 'sleeping') {
      return;
    }
    const resources = this.resources;
    const count = resources.order.update(this.emitter);
    this.syncSimulation();
    resources.artwork.sync(resources.shader, resources.uniforms.uniforms, this.animationHalfStep);
    this.syncTransform(transform);
    this.syncColor(displayColor);

    // Reuse the draw command; Pixi binds the shader, textures, geometry, and state.
    resources.state.blendMode = this.blendMode;
    resources.drawOptions.instanceCount = count;
    // Follow Pixi mesh rendering: bind the active render group and target uniforms.
    resources.shader.groups[100] = this.renderer.globalUniforms.bindGroup;
    this.renderer.encoder.draw(resources.drawOptions);
  }

  /** Release owned draw resources without destroying caller-owned textures. */
  public destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.resources.destroy();
  }

  /** Bind the current simulation texture and describe its layout and velocity stretch. */
  private syncSimulation(): void {
    this.resources.shader.resources.particles = this.resources.particleSources.get(
      this.emitter.texture,
    );
    const uniforms = this.resources.uniforms.uniforms;
    uniforms.width = this.emitter.width;
    uniforms.rows = this.emitter.rows;
    uniforms.stretchWithVelocity = this.emitter.stretchWithVelocity ? 1 : 0;
  }

  /** Local particles follow the emitter; world particles already contain world positions. */
  private syncTransform(transform: Matrix): void {
    const uniforms = this.resources.uniforms.uniforms;
    const localSpace = this.emitter.space === 'local';
    uniforms.emitterScale = localSpace ? this.emitter.worldScale : 1;
    uniforms.emitterHandedness = localSpace ? this.emitter.worldHandedness : 1;
    const radians = localSpace ? (-this.emitter.worldRotation * Math.PI) / 180 : 0;
    uniforms.emitterRotation[0] = Math.cos(radians);
    uniforms.emitterRotation[1] = Math.sin(radians);
    uniforms.emitterOffset[0] = localSpace ? this.emitter.worldX : 0;
    uniforms.emitterOffset[1] = localSpace ? this.emitter.worldY : 0;
    uniforms.transform = transform;
  }

  /** Keep emitter tint separate from Pixi’s packed, premultiplied display color. */
  private syncColor(displayColor: number): void {
    const uniforms = this.resources.uniforms.uniforms;
    color32BitToUniform(displayColor, uniforms.displayColor, 0);
    const tint = this.currentTint;
    uniforms.tint[0] = tint.red;
    uniforms.tint[1] = tint.green;
    uniforms.tint[2] = tint.blue;
    uniforms.tint[3] = tint.alpha;
  }
}
