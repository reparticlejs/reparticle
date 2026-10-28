import type { SimulationParameters } from './simulation';

/** Storage and stepping owned by one backend; playback stays in the shared emitter. */
export interface Simulation<T> {
  readonly texture: T;
  readonly birthTexture: T;
  update(parameters: SimulationParameters): void;
  clear(): void;
  reset(): void;
  destroy(): void;
}

/** Renderer adapter supplies the matching simulation without importing another backend. */
export interface SimulationContext<T> {
  identity: object;
  maxTextureSize: number;
  createSimulation(width: number, rows: number, capacity: number): Simulation<T>;
  /** Group synchronous updates; completed work is submitted before returning. */
  batchUpdates?(updates: () => void): void;
  /** Publish pending commands before invoking user callbacks. */
  flush?(): void;
  assertAvailable?: (() => void) | undefined;
  restoreState?: (() => void) | undefined;
}
