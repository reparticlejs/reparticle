import {
  ExtensionType,
  type Container,
  type InstructionSet,
  type RenderPipe,
  type WebGLRenderer,
} from 'pixi.js';

import { EmitterView } from '../runtime/emitter-view';
import { ParticleView } from '../runtime/particle-view';
import { restoreSimulationState } from './restore-simulation-state';
import { SimulationBoundary } from './simulation-boundary';

/**
 * Connect ParticleView to one Pixi WebGL renderer.
 *
 * Before rendering, capture scene transforms and initialize each view's GPU resources.
 * During rendering, insert particle draws into Pixi's instruction order so masks,
 * filters, and sibling layering remain under Pixi's control.
 *
 * The pipe owns EmitterView draw resources; ParticleView owns its core emitters.
 * Resources remain attached when a view leaves the stage, until the view or renderer
 * is destroyed. This lets initialized effects continue simulating while offstage.
 */
export class ParticlePipe implements RenderPipe<ParticleView> {
  public static readonly extension = {
    type: ExtensionType.WebGLPipes,
    name: 'reparticle',
  } as const;
  private readonly boundary: SimulationBoundary;
  private readonly assertContextAvailable: () => void;
  private readonly restoreContextState: () => void;
  private readonly emittersByView = new Map<ParticleView, Map<string, EmitterView>>();

  public constructor(private readonly renderer: WebGLRenderer) {
    // GPU.js changes framebuffers while compiling. Prepare before renderStart binds
    // Pixi's target, and before traversal temporarily detaches a rendered subtree.
    this.boundary = new SimulationBoundary(renderer);
    this.assertContextAvailable = this.assertAvailable.bind(this);
    this.restoreContextState = this.restoreState.bind(this);
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
  public addRenderable(view: ParticleView, instructions: InstructionSet): void {
    this.renderer.renderPipes.batch.break(instructions);
    instructions.add(view);
  }

  /** Nothing is stored in Pixi's batch buffers; execute reads the current particle data. */
  public updateRenderable(): void {}

  /** Particle changes do not require rebuilding Pixi's draw instruction list. */
  public validateRenderable(): boolean {
    return false;
  }

  public execute(view: ParticleView): void {
    if (!view.isRenderable) {
      return;
    }

    const emitterViews = this.emittersByView.get(view);
    if (emitterViews) {
      view.draw(emitterViews);
    }
  }

  /** Undefined until the view's first render has prepared its resources. */
  public getEmitterView(view: ParticleView, id: string): EmitterView | undefined {
    return this.emittersByView.get(view)?.get(id);
  }

  public assertAvailable(): void {
    this.boundary.assertAvailable();
  }

  /** Return control to Pixi after GPU.js changes WebGL state. */
  public restoreState(): void {
    this.assertAvailable();
    restoreSimulationState(this.renderer);
  }

  /** Release draw resources; ParticleView separately destroys its core simulations. */
  public destroyRenderable(view: ParticleView): void {
    this.assertAvailable();
    const emitterViews = this.emittersByView.get(view);
    if (!emitterViews) {
      return;
    }
    this.emittersByView.delete(view);
    for (const emitterView of emitterViews.values()) {
      emitterView.destroy();
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
    if (container instanceof ParticleView) {
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
  private initializeView(view: ParticleView): void {
    const emitterViews = new Map<string, EmitterView>();
    try {
      for (const [id, emitter] of view.emitters) {
        emitter.initialize({
          gl: this.renderer.gl,
          canvas: this.renderer.canvas,
          assertAvailable: this.assertContextAvailable,
          restoreState: this.restoreContextState,
        });
        // GPU.js initialization changes GL bindings before EmitterView binds its shader.
        this.restoreState();
        emitterViews.set(id, new EmitterView(this.renderer, emitter, view.getRendering(id)));
      }
      this.emittersByView.set(view, emitterViews);
    } catch (error) {
      for (const emitterView of emitterViews.values()) {
        emitterView.destroy();
      }
      view.destroy();
      throw error;
    } finally {
      this.restoreState();
    }
  }
}
