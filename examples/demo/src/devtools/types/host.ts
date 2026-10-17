export interface StatsHost {
  /** Called once after simulation and rendering for each frame. */
  subscribePostRender(listener: (timestamp: number) => void): () => void;
}
