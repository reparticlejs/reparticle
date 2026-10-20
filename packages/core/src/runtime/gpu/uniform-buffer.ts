import type { UniformVector } from '#types/simulation.js';

/**
 * Reuse two vec4 buffers without mutating GPU.js's cached upload reference.
 * Unchanged values retain the current buffer. A change writes into the other
 * buffer, allowing GPU.js to compare against the previous values correctly.
 */
export class UniformBuffer {
  private current: UniformVector = [0, 0, 0, 0];
  private spare: UniformVector = [0, 0, 0, 0];

  public set(x: number, y: number, z: number, w: number): UniformVector {
    if (
      this.current[0] === x &&
      this.current[1] === y &&
      this.current[2] === z &&
      this.current[3] === w
    ) {
      return this.current;
    }

    this.spare[0] = x;
    this.spare[1] = y;
    this.spare[2] = z;
    this.spare[3] = w;
    const previous = this.current;
    this.current = this.spare;
    this.spare = previous;
    return this.current;
  }
}
