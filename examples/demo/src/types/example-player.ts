import type { Example } from './example';

/** Controls for selecting and playing examples within a shared Pixi application. */
export interface ExamplePlayer {
  /**
   * Remove the previous effect and load this selection.
   * Returns true when mounted, false when cancelled or destroyed. Load failures reject.
   */
  select(example: Example): Promise<boolean>;
  /** Pause or resume the active effect; does nothing while loading. */
  setPaused(paused: boolean): void;
  /** Reset and resume the active effect, including its display-object movement. */
  restart(): void;
  /**
   * Cancel loading and release the effect. Safe to call more than once.
   * Players returned by createPixiApp also release the application, canvas, and stats.
   */
  destroy(): void;
}
