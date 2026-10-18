import type { ParticleOrderSource } from './types/particle-order';

/** One uint slot ID per live instance; attached to the emitter view's VAO. */
export class ParticleOrderBuffer {
  private readonly slots: Uint32Array;
  private revision = -1;
  private count = 0;
  private readonly buffer: WebGLBuffer;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    capacity: number,
  ) {
    this.slots = new Uint32Array(capacity);
    const buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error('Unable to create particle draw-order buffer');
    }
    this.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, capacity * Uint32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribIPointer(0, 1, gl.UNSIGNED_INT, 0, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  update(source: ParticleOrderSource): number {
    if (this.revision !== source.particleRevision) {
      this.count = source.copyParticleOrder(this.slots);
      this.revision = source.particleRevision;
      if (this.count > 0) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.slots, 0, this.count);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      }
    }
    return this.count;
  }

  destroy(): void {
    this.gl.deleteBuffer(this.buffer);
  }
}
