import type { SimulationContext } from '@reparticle/core';
import { type Container, type InstructionSet, type RenderPipe } from 'pixi.js';

import { EmitterRenderer } from '#runtime/emitter-renderer.js';
import { ParticleEffect } from '#runtime/particle-effect.js';
import type { ParticleBackend, ParticleRenderer } from '#types/backend.js';

import { SimulationBoundary } from './simulation-boundary';

/**
 * Connect ParticleEffect to one Pixi renderer.
 *
 * Before rendering, capture scene transforms and initialize each view's GPU resources.
 * During rendering, insert particle draws into Pixi's instruction order so masks,
 * filters, and sibling layering remain under Pixi's control.
 *
 * The pipe owns EmitterRenderer draw resources; ParticleEffect owns its core emitters.
 * Resources remain attached when a view leaves the stage, until the view or renderer
 * is destroyed. This lets initialized effects continue simulating while offstage.
 */
export class ParticlePipe implements RenderPipe<ParticleEffect> {
  private simulationContext: SimulationContext<WebGLTexture | GPUTexture> | null = null;
  private readonly boundary: SimulationBoundary;
  private readonly assertContextAvailable: () => void;
  private readonly restoreContextState: () => void;
  private readonly emittersByView = new Map<ParticleEffect, Map<string, EmitterRenderer>>();

  public constructor(
    private readonly renderer: ParticleRenderer,
    private readonly backend: ParticleBackend,
  ) {
    // Simulation initialization changes framebuffers. Prepare before renderStart binds
    // Pixi's target, and before traversal temporarily detaches a rendered subtree.
    this.boundary = new SimulationBoundary(renderer);
    this.assertContextAvailable = this.assertAvailable.bind(this);
    // Choose once: WebGL restores shared bindings; WebGPU only needs the guard.
    const restoreState = backend.restoreState?.bind(backend);
    this.restoreContextState = restoreState
      ? () => {
          this.assertContextAvailable();
          restoreState();
        }
      : this.assertContextAvailable;
    renderer.runners.prerender.add(this);
  }

  /** Pixi runner hook: prepare resources before render targets and subtree transforms change. */
  public prerender({ container }: { container: Container }): void {
    this.boundary.beginPreparation();
    try {
      this.prepareSubtree(container);
    } finally {
      this.boundary.endPreparation();
    }
  }

  /** Finish pending sprite batches before inserting the particle draw. */
  public addRenderable(view: ParticleEffect, instructions: InstructionSet): void {
    this.renderer.renderPipes.batch.break(instructions);
    instructions.add(view);
  }

  /** Nothing is stored in Pixi's batch buffers; execute reads the current particle data. */
  public updateRenderable(): void {}

  /** Particle changes do not require rebuilding Pixi's draw instruction list. */
  public validateRenderable(): boolean {
    return false;
  }

  public execute(view: ParticleEffect): void {
    if (!view.isRenderable) {
      return;
    }

    const emitterRenderers = this.emittersByView.get(view);
    if (emitterRenderers) {
      view.draw(emitterRenderers);
    }
  }

  /** Undefined until the view's first render has prepared its resources. */
  public getEmitterRenderer(view: ParticleEffect, id: string): EmitterRenderer | undefined {
    return this.emittersByView.get(view)?.get(id);
  }

  public assertAvailable(): void {
    this.boundary.assertAvailable();
  }

  /** Return control to Pixi after simulation changes WebGL state. */
  public restoreState(): void {
    this.restoreContextState();
  }

  /** Release draw resources; ParticleEffect separately destroys its core simulations. */
  public destroyRenderable(view: ParticleEffect): void {
    this.assertAvailable();
    const emitterRenderers = this.emittersByView.get(view);
    if (!emitterRenderers) {
      return;
    }
    this.emittersByView.delete(view);
    for (const emitterRenderer of emitterRenderers.values()) {
      emitterRenderer.destroy();
    }
  }

  /** Renderer disposal also destroys attached effects, including those currently offstage. */
  public destroy(): void {
    this.assertAvailable();
    this.renderer.runners.prerender.remove(this);
    // Simulation textures belong to this renderer too; a live view cannot migrate
    // them to another context without losing its particle state.
    for (const view of this.emittersByView.keys()) {
      view.destroy();
    }
    this.boundary.destroy();
  }

  private prepareSubtree(container: Container): void {
    if (container instanceof ParticleEffect) {
      container.prepare(this);
      if (!this.emittersByView.has(container)) {
        this.initializeView(container);
      }
    }
    for (const child of container.children) {
      this.prepareSubtree(child);
    }
  }

  /** Publish resources only after every emitter succeeds; dispose partial work on failure. */
  private initializeView(view: ParticleEffect): void {
    // Pixi creates pipes before initializing the device; borrow it on first render.
    this.simulationContext ??= this.backend.createContext(
      this.assertContextAvailable,
      this.restoreContextState,
    );
    view.configureUpdates(this.simulationContext.batchUpdates?.bind(this.simulationContext));
    const emitterRenderers = new Map<string, EmitterRenderer>();
    try {
      for (const [id, emitter] of view.emitters) {
        emitter.initialize(this.simulationContext);
        // simulation initialization changes GL bindings before EmitterRenderer binds its shader.
        this.restoreState();
        emitterRenderers.set(
          id,
          new EmitterRenderer(this.renderer, emitter, this.backend, view.getRendering(id)),
        );
      }
      this.emittersByView.set(view, emitterRenderers);
    } catch (error) {
      for (const emitterRenderer of emitterRenderers.values()) {
        emitterRenderer.destroy();
      }
      view.destroy();
      throw error;
    } finally {
      this.restoreState();
    }
  }
}
