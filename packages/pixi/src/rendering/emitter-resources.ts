import type { EmitterController } from '@reparticle/core';
import { Geometry, Shader, State, Texture } from 'pixi.js';

import { EmitterArtwork } from '#textures/emitter-artwork.js';
import { SimulationSources } from '#textures/simulation-sources.js';
import type { ParticleBackend, ParticleRenderer } from '#types/backend.js';
import type { ParticleTexture } from '#types/particle-texture.js';

import { createUniforms } from './uniforms';

const PARTICLE_BANDS = 2;

/**
 * Owns one emitter's draw resources and reusable draw command.
 * Construction either succeeds completely or releases every resource created so far.
 * Simulation textures, caller artwork and Pixi's cached programs remain borrowed.
 */
export class EmitterResources {
  public readonly artwork: EmitterArtwork;
  public readonly shader: Shader;
  public readonly particleSources: SimulationSources;
  public readonly birthSources: SimulationSources;
  public readonly state: State;
  public readonly geometry: Geometry;
  public readonly drawOptions: Parameters<ParticleRenderer['encoder']['draw']>[0];
  public readonly uniforms: ReturnType<typeof createUniforms>;
  private disposed = false;

  public constructor(
    renderer: ParticleRenderer,
    emitter: EmitterController,
    private readonly backend: ParticleBackend,
    options: ParticleTexture<Texture>,
  ) {
    this.state = backend.createState?.() ?? State.for2d();
    this.uniforms = createUniforms(emitter.configuration);
    this.particleSources = new SimulationSources(
      renderer,
      emitter.width,
      emitter.rows * PARTICLE_BANDS,
    );
    this.birthSources = new SimulationSources(renderer, emitter.width, emitter.rows * 3);
    let artwork: EmitterArtwork | undefined;
    let shader: Shader | undefined;
    let geometry: Geometry | undefined;
    try {
      artwork = new EmitterArtwork(backend.maxTextureSize, options, backend.bindArtwork);
      this.artwork = artwork;
      shader = backend.createShader({
        particleUniforms: this.uniforms,
        particles: this.particleSources.get(emitter.texture),
        birthParticles: this.birthSources.get(emitter.birthTexture),
        artwork: Texture.EMPTY.source,
        animationFrames: Texture.EMPTY.source,
        artworkSampler: Texture.EMPTY.source.style,
      });
      this.shader = shader;
      // Compile now, but defer uniform syncing until the active global group is bound.
      backend.prepareShader?.(shader);
      // Each backend supplies the quad geometry its vertex shader expects.
      geometry = backend.createGeometry();
      this.geometry = geometry;
      this.drawOptions = {
        geometry,
        shader,
        state: this.state,
        topology: 'triangle-strip',
        size: 4,
        start: 0,
        instanceCount: emitter.capacity,
      };
    } catch (error) {
      geometry?.destroy();
      shader?.destroy();
      artwork?.destroy();
      this.particleSources.destroy();
      this.birthSources.destroy();
      throw error;
    } finally {
      backend.restoreState?.();
    }
  }

  /** Release owned resources once, then restore Pixi's cached WebGL bindings. */
  public destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    try {
      this.geometry.destroy();
      // Pixi owns the shared GL program / GPU pipeline caches.
      this.shader.destroy();
      this.artwork.destroy();
      this.particleSources.destroy();
      this.birthSources.destroy();
    } finally {
      this.backend.restoreState?.();
    }
  }
}
