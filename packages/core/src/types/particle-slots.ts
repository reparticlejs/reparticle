/** Slots born in one step share an age and are ordered by sampled lifetime. */
export interface ParticleSlotBatch {
  slots: Uint32Array;
  next: number;
  age: number;
}
