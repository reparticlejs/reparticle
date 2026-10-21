import { Buffer, BufferUsage, Geometry, type WebGLRenderer } from 'pixi.js';

import type { ParticleOrderSource } from '../types/particle-order';

/** CPU draw order backed by Pixi resources; simulation slots never move. */
export class ParticleOrderBuffer {
  public readonly geometry: Geometry;
  private readonly slots: Uint32Array;
  private readonly buffer: Buffer;
  private revision = -1;
  private count = 0;

  public constructor(renderer: WebGLRenderer, capacity: number) {
    this.slots = new Uint32Array(capacity);
    this.buffer = new Buffer({
      label: 'particle draw order',
      size: this.slots.byteLength,
      usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
      shrinkToFit: false,
    });
    try {
      // Reserve capacity without uploading unused slots. Later updates upload
      // only the live prefix, including the first visible draw after prewarm.
      renderer.buffer.updateBuffer(this.buffer);
      this.geometry = new Geometry({
        topology: 'triangle-strip',
        attributes: {
          particleId: {
            buffer: this.buffer,
            format: 'uint32',
            stride: Uint32Array.BYTES_PER_ELEMENT,
            offset: 0,
            instance: true,
          },
        },
      });
    } catch (error) {
      this.buffer.destroy();
      throw error;
    }
  }

  /** Mark changed live slot IDs for upload when Pixi next binds the geometry. */
  public update(source: ParticleOrderSource): number {
    if (this.revision !== source.particleRevision) {
      this.count = source.copyParticleOrder(this.slots);
      this.revision = source.particleRevision;
      if (this.count > 0) {
        // This API takes an element count; Buffer.update() instead takes bytes.
        this.buffer.setDataWithSize(this.slots, this.count, false);
      }
    }
    return this.count;
  }

  /** Geometry owns its sole buffer; Pixi releases both the VAO and GPU storage. */
  public destroy(): void {
    this.geometry.destroy(true);
  }
}
