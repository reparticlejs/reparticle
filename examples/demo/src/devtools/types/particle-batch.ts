/** Particles born in one update share an age; spread optionally gives each slot its own lifetime. */
export interface ParticleBatch {
  start: number;
  end: number;
  age: number;
  lifetime: number;
  lifetimes?: Float32Array;
  origin?: number;
}
