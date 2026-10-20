import type { UniformVector } from '#types/simulation.js';

/**
 * Reusable CPU storage for one vec4 uniform on one GPU.js kernel.
 *
 * GPU.js retains the uploaded array itself when caching uniform values. Editing
 * that array in place would also edit the cache, making a change look unchanged.
 * Keep current values intact and write changes into the spare array instead.
 *
 * Each alternating simulation kernel needs its own instance. These arrays are
 * ordinary numeric inputs; this class neither creates GL buffers nor uploads.
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

    // Preserve the array GPU.js may still be comparing against.
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
