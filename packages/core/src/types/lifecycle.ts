/**
 * Emitter playback phase, independent of its emission gate and particle count.
 *
 * - prespawn: initial or reset state, waiting to begin after the start delay.
 * - spawning: emission cycle is running, even when rate or the emission gate is zero.
 * - postspawn: emission has stopped; existing particles may still be draining.
 * - sleeping: emission has stopped and a simulation step confirmed no particles remain.
 *
 * Loop boundaries stay in spawning. These states do not indicate destruction.
 */
export type EmitterState = 'prespawn' | 'spawning' | 'postspawn' | 'sleeping';

/** One queued playback transition, identified by the emitter's configured ID. */
export interface EmitterStateChange {
  /** Identifies the source when subscribing to multiple emitters. */
  emitterId: string;

  /** State entered by this transition; later queued transitions may already exist. */
  state: EmitterState;
}

/**
 * Receive transitions in order, without an initial event when subscribing.
 * Updates deliver notifications after simulation work; stop/reset also flush
 * transitions. Changes made inside a listener wait until the current batch ends.
 * A callback may observe a newer emitter.state than event.state
 * when several transitions occurred during one update, including prewarm.
 */
export type EmitterStateListener = (event: EmitterStateChange) => void;

/** Options for stopping births immediately, rather than retiring after the current loop. */
export interface StopOptions {
  /**
   * Remove existing particles immediately when true. Defaults to false, allowing
   * them to drain through continued updates. Sleeping is reported on a subsequent
   * update once the stopped emitter is confirmed empty, even when clearing.
   */
  clear?: boolean;
}
