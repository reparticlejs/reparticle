/**
 * Mutable CPU metadata for particles admitted during one simulation step.
 * All share an age, so ordering by lifetime lets expiration consume a prefix.
 * ParticleSlots owns this batch; individual lifetimes are stored separately by
 * slot index. No particle-state texture data is copied into this record.
 */
export interface ParticleSlotBatch {
  /**
   * Fixed GPU slot IDs in nondecreasing lifetime order, not rendering order.
   * With spread, slot ID breaks lifetime ties; without spread, allocation order
   * is retained because every lifetime is equal. Compaction may replace this
   * array with its surviving suffix without moving any GPU particle data.
   */
  slots: Uint32Array;

  /**
   * Array index of the first live entry, not a slot ID or a particle count.
   * Entries before it have expired; live entries occupy [next, slots.length).
   * Compaction resets it to zero, and fully expired batches are removed.
   */
  next: number;

  /**
   * Shared age in seconds, initialized to the birth step's duration.
   * Each positive step advances it with float32 rounding to match GPU timing.
   */
  age: number;

  /**
   * Allocation revision captured when this batch was born.
   * Remains unchanged as the batch ages or compacts; paired with a slot ID,
   * distinguishes that particle from later reuse within the same allocator.
   */
  generation: number;
}
