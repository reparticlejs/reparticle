import type { UniformVector } from '#types/simulation.js';

/**
 * Reusable vec4 input storage. Changed values use the spare array, preserving
 * the previous borrowed value until the next change. No GL uploads happen here.
 */
export class UniformBuffer {
  private current: UniformVector = [0, 0, 0, 0];
  private spare: UniformVector = [0, 0, 0, 0];

  /**
   * Prepare four components without allocating an array.
   *
   * Unchanged values return the same reference. Changed values swap the two
   * arrays. Submit the returned array to its kernel before preparing another
   * changed value; treat it as borrowed storage, not an immutable snapshot.
   */
  public set(x: number, y: number, z: number, w: number): UniformVector {
    if (
      this.current[0] === x &&
      this.current[1] === y &&
      this.current[2] === z &&
      this.current[3] === w
    ) {
      return this.current;
    }

    // Preserve the previous borrowed input until the next change.
    const next = this.spare;
    next[0] = x;
    next[1] = y;
    next[2] = z;
    next[3] = w;

    const previous = this.current;
    this.current = next;
    this.spare = previous;

    return next;
  }
}
