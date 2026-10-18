import type { EmitterStateChange } from '@reparticle/core';

export interface ParticleStateChange extends EmitterStateChange {
  awakeEmitters: number;
}

export type ParticleStateListener = (event: ParticleStateChange) => void;
