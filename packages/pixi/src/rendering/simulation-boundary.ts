import { Container, type RenderOptions, type Renderer } from 'pixi.js';

/**
 * Protect the GPU context shared by Pixi and simulation.
 * Simulation is allowed between renders and during the particle pipe's preparation.
 * It is blocked throughout the rest of a render, including user callbacks.
 *
 * Wrap render() rather than relying on postrender: Pixi skips that notification
 * when rendering throws. The wrapper's finally block always releases the guard.
 */
export class SimulationBoundary {
  private renderInProgress = false;
  private preparingResources = false;
  private readonly originalRender: Renderer['render'];
  private readonly guardedRender: Renderer['render'];

  public constructor(private readonly renderer: Renderer) {
    this.originalRender = renderer.render.bind(renderer);
    this.guardedRender = this.render.bind(this);
    renderer.render = this.guardedRender;
  }

  /** Call before changing simulation state or releasing graphics resources. */
  public assertAvailable(): void {
    if (!this.renderInProgress || this.preparingResources) {
      return;
    }

    throw new Error(
      'Particle simulation cannot change during rendering; update it before renderer.render()',
    );
  }

  /** Open the pipe's prerender window, before Pixi binds targets, filters, and masks. */
  public beginPreparation(): void {
    this.preparingResources = true;
  }

  /** Close that window in the pipe's finally block, including initialization failures. */
  public endPreparation(): void {
    this.preparingResources = false;
  }

  /** Remove our wrapper without overwriting a replacement installed by someone else. */
  public destroy(): void {
    this.assertAvailable();
    if (this.renderer.render === this.guardedRender) {
      this.renderer.render = this.originalRender;
    }
  }

  /** Keep the guard active for the entire call, including prerender and postrender callbacks. */
  private render(
    options: RenderOptions | Container,
    legacyOptions?: Parameters<Renderer['render']>[1],
  ): void {
    if (this.renderInProgress) {
      throw new Error(
        'Nested renderer.render() is not supported while a particle renderer is active',
      );
    }

    this.renderInProgress = true;
    try {
      // Normalize legacy arguments without calling Pixi's deprecated overload.
      if (legacyOptions && options instanceof Container) {
        this.originalRender({ container: options, target: legacyOptions.renderTexture });
      } else {
        this.originalRender(options);
      }
    } finally {
      this.renderInProgress = false;
    }
  }
}
