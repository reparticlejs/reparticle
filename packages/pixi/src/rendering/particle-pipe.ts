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

/** Renderer-owned resources and draw instructions for particle display objects. */
export class ParticlePipe implements RenderPipe<ParticleView> {
  public static readonly extension = {
    type: ExtensionType.WebGLPipes,
    name: 'reparticle',
  } as const;
  private readonly resources = new Map<ParticleView, Map<string, EmitterView>>();

  public constructor(private readonly renderer: WebGLRenderer) {
    // GPU.js changes framebuffers while compiling. Prepare before renderStart binds
    // Pixi's target, and before traversal temporarily detaches a rendered subtree.
    renderer.runners.prerender.add(this);
  }

  public addRenderable(view: ParticleView, instructions: InstructionSet): void {
    this.renderer.renderPipes.batch.break(instructions);
    instructions.add(view);
  }

  public updateRenderable(): void {}

  public validateRenderable(): boolean {
    return false;
  }

  public execute(view: ParticleView): void {
    if (view.isRenderable) {
      const resources = this.resources.get(view);
      if (resources) {
        view.draw(resources);
      }
    }
  }

  public getEmitterView(view: ParticleView, id: string): EmitterView | undefined {
    return this.resources.get(view)?.get(id);
  }

  public restoreState(): void {
    restoreSimulationState(this.renderer);
  }

  public destroyRenderable(view: ParticleView): void {
    const resources = this.resources.get(view);
    if (!resources) {
      return;
    }
    this.resources.delete(view);
    for (const resource of resources.values()) {
      resource.destroy();
    }
  }

  public destroy(): void {
    this.renderer.runners.prerender.remove(this);
    // Simulation textures belong to this renderer too; a live view cannot migrate
    // them to another context without losing its particle state.
    for (const view of this.resources.keys()) {
      view.destroy();
    }
  }

  private prerender({ container }: { container: Container }): void {
    this.prepare(container);
  }

  private prepare(container: Container): void {
    if (container instanceof ParticleView) {
      container.prepare(this);
      if (!this.resources.has(container)) {
        this.initialize(container);
      }
    }
    for (const child of container.children) {
      this.prepare(child);
    }
  }

  private initialize(view: ParticleView): void {
    const resources = new Map<string, EmitterView>();
    try {
      for (const [id, emitter] of view.emitters) {
        emitter.initialize({ gl: this.renderer.gl, canvas: this.renderer.canvas });
        // GPU.js initialization changes GL bindings before EmitterView binds its shader.
        this.restoreState();
        resources.set(id, new EmitterView(this.renderer, emitter, view.getRendering(id)));
      }
      this.resources.set(view, resources);
    } catch (error) {
      for (const resource of resources.values()) {
        resource.destroy();
      }
      view.destroy();
      throw error;
    } finally {
      this.restoreState();
    }
  }
}
