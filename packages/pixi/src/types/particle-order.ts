/** Final logical order supplied by core after all simulation steps, including prewarm. */
export interface ParticleOrderSource {
  readonly particleRevision: number;
  copyParticleOrder(target: Uint32Array): number;
}
