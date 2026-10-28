import { ExternalSource, type WebGLRenderer, type WebGPURenderer } from 'pixi.js';

/**
 * Adapt core simulation textures for Pixi's shader resources.
 *
 * core supplies raw GPU texture handles; Pixi binds them through ExternalSource.
 * Each handle gets one cached wrapper, reused whenever that output becomes current.
 * No particle data is copied, uploaded, or read back by this adapter.
 *
 * One emitter view owns this cache. core owns the underlying textures, and both
 * libraries must use the same GPU context. Width and height describe the full
 * simulation texture, including every particle-state row band.
 */
export class SimulationSources {
  private readonly sourcesByTexture = new Map<WebGLTexture | GPUTexture, ExternalSource>();

  public constructor(
    private readonly renderer: WebGLRenderer | WebGPURenderer,
    private readonly width: number,
    private readonly height: number,
  ) {}

  /**
   * Return the cached source, creating it only on the handle's first use.
   * Simulation reuses its two alternating state outputs and a fixed birth output.
   * Separate wrappers let Pixi detect texture switches through source identity.
   */
  public get(texture: WebGLTexture | GPUTexture): ExternalSource {
    const cachedSource = this.sourcesByTexture.get(texture);
    if (cachedSource) {
      return cachedSource;
    }

    const source = new ExternalSource({
      resource: texture,
      renderer: this.renderer,
      width: this.width,
      height: this.height,
      label: 'particle simulation',
    });
    // Texels hold numeric particle state, so neighboring values must not be blended.
    source.style.scaleMode = 'nearest';

    this.sourcesByTexture.set(texture, source);
    return source;
  }

  /** Release Pixi wrappers when the emitter view is disposed; core deletes its own textures. */
  public destroy(): void {
    for (const source of this.sourcesByTexture.values()) {
      source.destroy();
    }
    this.sourcesByTexture.clear();
  }
}
