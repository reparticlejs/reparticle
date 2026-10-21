import { Container, type RenderOptions, type WebGLRenderer } from 'pixi.js';

/**
 * Keep GPU.js outside Pixi render passes, including reentrant calls from callbacks.
 * A render wrapper is necessary because Pixi does not emit postrender after an error.
 * Only the pipe's prerender preparation may initialize simulations inside that wrapper.
 */
export class SimulationBoundary {
  private rendering = false;
  private preparing = false;
  private readonly originalRender: WebGLRenderer['render'];
  private readonly guardedRender: WebGLRenderer['render'];

  public constructor(private readonly renderer: WebGLRenderer) {
    this.originalRender = renderer.render.bind(renderer);
    const render = this.originalRender;
    this.guardedRender = (
      options: RenderOptions | Container,
      legacy?: Parameters<WebGLRenderer['render']>[1],
    ): void => {
      if (this.rendering) {
        throw new Error(
          'Nested renderer.render() is not supported while a particle renderer is active',
        );
      }
      this.rendering = true;
      try {
        if (legacy && options instanceof Container) {
          render(options, legacy);
        } else {
          render(options);
        }
      } finally {
        this.rendering = false;
      }
    };
    renderer.render = this.guardedRender;
  }

  /** Reject before any simulation state or WebGL resources change. */
  public assertAvailable(): void {
    if (this.rendering && !this.preparing) {
      throw new Error(
        'Particle simulation cannot change during rendering; update it before renderer.render()',
      );
    }
  }

  public beginPreparation(): void {
    this.preparing = true;
  }

  public endPreparation(): void {
    this.preparing = false;
  }

  public destroy(): void {
    this.assertAvailable();
    if (this.renderer.render === this.guardedRender) {
      this.renderer.render = this.originalRender;
    }
  }
}
