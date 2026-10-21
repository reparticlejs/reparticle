import { Buffer, BufferUsage, Geometry, type WebGLRenderer } from 'pixi.js';

import type { ParticleOrderSource } from '#types/particle-order.js';

/**
 * Send core's ordered live particle IDs to the vertex shader.
 * An order such as [3, 0, 4] draws those simulation slots without moving their data.
 * Each particle instance receives one ID; the shader builds its four quad corners.
 *
 * CPU and GPU storage are reserved once for the emitter's capacity. Updates reuse
 * that storage and upload only the live prefix when core's order revision changes.
 * No simulation texture is copied or read back.
 */
export class ParticleOrderBuffer {
  public readonly geometry: Geometry;
  private readonly orderedSlots: Uint32Array;
  private readonly buffer: Buffer;
  private copiedRevision = -1;
  private liveCount = 0;

  public constructor(renderer: WebGLRenderer, capacity: number) {
    this.orderedSlots = new Uint32Array(capacity);
    this.buffer = new Buffer({
      label: 'particle draw order',
      size: this.orderedSlots.byteLength,
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
            // Advance the ID per particle, not per corner of its quad.
            instance: true,
          },
        },
      });
    } catch (error) {
      this.buffer.destroy();
      throw error;
    }
  }

  /**
   * Copy the latest order and return the instance count for drawing.
   * Pixi uploads the marked prefix on its next bind. Several simulation steps before
   * a draw, including prewarm, therefore require only the final order to be uploaded.
   */
  public update(source: ParticleOrderSource): number {
    if (this.copiedRevision === source.particleRevision) {
      return this.liveCount;
    }

    this.liveCount = source.copyParticleOrder(this.orderedSlots);
    this.copiedRevision = source.particleRevision;

    // Empty orders draw zero instances; the previous buffer contents can stay intact.
    if (this.liveCount > 0) {
      // Count is in uint32 elements, not bytes. Keep the existing GPU allocation.
      this.buffer.setDataWithSize(this.orderedSlots, this.liveCount, false);
    }

    return this.liveCount;
  }

  /** Geometry owns its sole buffer; Pixi releases both the VAO and GPU storage. */
  public destroy(): void {
    this.geometry.destroy(true);
  }
}
