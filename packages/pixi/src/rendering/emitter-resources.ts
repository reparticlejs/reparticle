import type { Emitter } from '@reparticle/core';
import { Geometry, GlProgram, Shader, State, Texture, type WebGLRenderer } from 'pixi.js';

import type { ParticleTexture } from '#types/particle-texture.js';

import fragment from '../shaders/particle.frag.glsl';
import vertex from '../shaders/particle.vert.glsl';
import { EmitterArtwork } from '../textures/emitter-artwork';
import { SimulationSources } from '../textures/simulation-sources';
import { restoreSimulationState } from './restore-simulation-state';
import { createUniforms } from './uniforms';

const PARTICLE_BANDS = 5;

/**
 * Owns one emitter's draw resources and reusable draw command.
 * Construction either succeeds completely or releases every resource created so far.
 * Simulation textures, caller artwork and Pixi's cached programs remain borrowed.
 */
export class EmitterResources {
  public readonly artwork: EmitterArtwork;
  public readonly shader: Shader;
  public readonly particleSources: SimulationSources;
  public readonly state = State.for2d();
  public readonly geometry: Geometry;
  public readonly drawOptions: Parameters<WebGLRenderer['encoder']['draw']>[0];
  public readonly uniforms: ReturnType<typeof createUniforms>;
  private disposed = false;

  public constructor(
    private readonly renderer: WebGLRenderer,
    emitter: Emitter,
    options: ParticleTexture<Texture>,
  ) {
    this.uniforms = createUniforms(emitter.configuration);
    const gl = renderer.gl;
    this.particleSources = new SimulationSources(
      renderer,
      emitter.width,
      emitter.rows * PARTICLE_BANDS,
    );
    let artwork: EmitterArtwork | undefined;
    let shader: Shader | undefined;
    let geometry: Geometry | undefined;
    try {
      artwork = new EmitterArtwork(gl.getParameter(gl.MAX_TEXTURE_SIZE), options);
      this.artwork = artwork;
      shader = new Shader({
        glProgram: GlProgram.from({ vertex, fragment, name: 'reparticle' }),
        resources: {
          particleUniforms: this.uniforms,
          particles: this.particleSources.get(emitter.texture),
          artwork: Texture.EMPTY.source,
          animationFrames: Texture.EMPTY.source,
        },
      });
      this.shader = shader;
      // Compile now, but defer uniform syncing until the active global group is bound.
      renderer.shader.bind(shader, true);
      // Instance and vertex IDs address slots and quad corners without buffers.
      geometry = new Geometry({ topology: 'triangle-strip' });
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
      throw error;
    } finally {
      restoreSimulationState(renderer);
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
      this.artwork.destroy();
      // GlProgram.from() is shared; Pixi owns the compiled program cache.
      this.shader.destroy();
      this.particleSources.destroy();
    } finally {
      restoreSimulationState(this.renderer);
    }
  }
}
