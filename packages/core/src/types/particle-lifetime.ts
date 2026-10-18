/** Allocation metadata for rendering; generation changes whenever a slot is reused. */
export type ParticleLifetimeVisitor = (
  slot: number,
  age: number,
  lifetime: number,
  generation: number,
) => void;
