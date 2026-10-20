import { particleSortKey } from './sort-key';

const BYTE_VALUES = 256;
const BYTE_MASK = BYTE_VALUES - 1;
const EXPIRED_KEY = 65536; // Outside the live key range [0, 65535].

/**
 * CPU draw order represented by fixed GPU slot IDs; particle textures never move.
 * Lower lifetime keys draw first. Equal keys retain the logical order produced
 * by prior sorting, swap-removal, and appended births.
 * All sorting buffers are allocated once and reused without GPU readbacks.
 */
export class ParticleOrder {
  private readonly slots: Uint32Array;
  // Indexed by GPU slot, not by position in the draw-order array.
  private readonly keys: Uint32Array;
  private readonly scratch: Uint32Array;
  private readonly bins = new Uint32Array(BYTE_VALUES);
  private count = 0;

  public constructor(capacity: number) {
    this.slots = new Uint32Array(capacity);
    this.keys = new Uint32Array(capacity);
    this.scratch = new Uint32Array(capacity);
  }

  /** Append a newly allocated slot; the caller sets its lifetime key before sorting. */
  public add(slot: number): void {
    this.slots[this.count++] = slot;
  }

  /** Mark a slot for removal without searching the order array. */
  public expire(slot: number): void {
    this.keys[slot] = EXPIRED_KEY;
  }

  /**
   * Remove marked entries by replacing each with the last live entry.
   * Recheck that position because the replacement may also be expired.
   * This deliberately changes logical order and therefore subsequent tie breaking.
   */
  public removeExpired(): void {
    let index = 0;
    while (index < this.count) {
      if (this.keys[this.slots[index]!] === EXPIRED_KEY) {
        this.count--;
        this.slots[index] = this.slots[this.count]!;
      } else {
        index++;
      }
    }
  }

  /** Refresh the 16-bit key using CPU lifetime metadata. */
  public setLifetime(slot: number, age: number, lifetime: number, maximum: number): void {
    this.keys[slot] = particleSortKey(age, lifetime, maximum);
  }

  /**
   * Sort live keys in two stable passes: low byte first, then high byte.
   * Remove expired entries first; their sentinel is not a valid 16-bit key.
   * Cost is linear in the live count, plus 256 buckets per pass.
   */
  public sort(): void {
    if (this.count < 2) {
      return;
    }
    this.sortByte(this.slots, this.scratch, 0);
    this.sortByte(this.scratch, this.slots, 8);
  }

  /** Copy only active slot IDs into the renderer buffer and return their count. */
  public copyTo(target: Uint32Array): number {
    if (target.length < this.count) {
      throw new RangeError('Particle order destination is too small');
    }
    target.set(this.slots.subarray(0, this.count));
    return this.count;
  }

  /** Discard the order; backing buffers remain allocated for reuse. */
  public reset(): void {
    this.count = 0;
  }

  private sortByte(source: Uint32Array, target: Uint32Array, shift: number): void {
    const bins = this.bins;
    bins.fill(0);

    // Count how many keys fall into each byte bucket.
    for (let index = 0; index < this.count; index++) {
      const slot = source[index]!;
      const bucket = (this.keys[slot]! >>> shift) & BYTE_MASK;
      bins[bucket]!++;
    }

    // Replace counts with the first output position for each bucket.
    let nextOffset = 0;
    for (let bucket = 0; bucket < BYTE_VALUES; bucket++) {
      const bucketSize = bins[bucket]!;
      bins[bucket] = nextOffset;
      nextOffset += bucketSize;
    }

    // Write in source order so equal-byte keys retain their relative order.
    // Each bucket's offset advances to the next free output position.
    for (let index = 0; index < this.count; index++) {
      const slot = source[index]!;
      const bucket = (this.keys[slot]! >>> shift) & BYTE_MASK;
      target[bins[bucket]!] = slot;
      bins[bucket]!++;
    }
  }
}
