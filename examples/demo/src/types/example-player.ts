import type { Example } from './example';

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
  /** Cancel loading and release the effect. Safe to call more than once. */
  destroy(): void;
}
