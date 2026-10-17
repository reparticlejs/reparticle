/** Particles born in one update share an age and lifetime. */
export interface ParticleBatch {
  start: number;
  end: number;
  age: number;
  lifetime: number;
}
