export type EmitterState = 'prespawn' | 'spawning' | 'postspawn' | 'sleeping';

export interface EmitterStateChange {
  emitterId: string;
  state: EmitterState;
}

export type EmitterStateListener = (event: EmitterStateChange) => void;

export interface StopOptions {
  clear?: boolean;
}

export interface LifetimeBatch {
  start: number;
  end: number;
  age: number;
  lifetime: number;
  spread: number;
  seed: number;
  maximum: number;
}
