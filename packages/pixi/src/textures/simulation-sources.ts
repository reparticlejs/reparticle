import { ExternalSource, type WebGLRenderer } from 'pixi.js';

/** Borrow GPU.js outputs without copying pixels or transferring texture ownership. */
export class SimulationSources {
  private readonly sources = new Map<WebGLTexture, ExternalSource>();

  public constructor(
    private readonly renderer: WebGLRenderer,
    private readonly width: number,
    private readonly height: number,
  ) {}

  /**
   * Each kernel keeps its output handle: initialization and the two update paths.
   * Wrap each on first use, then reuse it. Distinct source identities let Pixi's
   * binding cache follow texture switches without per-frame wrapper allocation.
   */
  public get(texture: WebGLTexture): ExternalSource {
    let source = this.sources.get(texture);
    if (!source) {
      source = new ExternalSource({
        resource: texture,
        renderer: this.renderer,
        width: this.width,
        height: this.height,
        label: 'particle simulation',
      });
      source.style.scaleMode = 'nearest';
      this.sources.set(texture, source);
    }
    return source;
  }

  /** ExternalSource releases its wrapper; only GPU.js deletes the borrowed texture. */
  public destroy(): void {
    for (const source of this.sources.values()) {
      source.destroy();
    }
    this.sources.clear();
  }
}
