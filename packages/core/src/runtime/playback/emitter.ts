import { propertyVariation } from '#simulation/emission/variation.js';
import type { EmitterConfig } from '#types/effect.js';
import type { EmitterState } from '#types/lifecycle.js';
import type { PlaybackVariation } from '#types/playback.js';

/**
 * Frame-based emission clock, independent of individual particle ages.
 * Lifecycle: prespawn (delay) → spawning → postspawn (draining) → sleeping.
 * Loop boundaries stay in spawning. The caller reports when particles have
 * drained through finish(); this class does not track particle counts.
 */
export class EmitterPlayback {
  // Counts delay time first, then time within the current emission cycle.
  private elapsed = 0;
  /** Normalized interval consumed by the last emitting step, before loop wrapping. */
  public emissionStartAge = 0;
  public emissionEndAge = 0;
  private emissionStopped = false;
  private retireAfterLoop = false;
  private waitingForDelay = true;
  private currentState: EmitterState = 'prespawn';
  private transitions: EmitterState[] = [];

  private readonly duration: number;
  private readonly startDelay: number;

  public constructor(
    private readonly authoredDuration: number,
    private readonly playMode: EmitterConfig['playMode'],
    startDelay = 0,
    { seed = 0, durationSpread = 0, startDelaySpread = 0 }: PlaybackVariation = {},
  ) {
    // Independent random channels keep these samples fixed across loops and resets.
    // Duration cannot be negative; a negative delay advances the initial cycle age.
    this.duration = Math.max(0, authoredDuration + propertyVariation(0, seed, 9) * durationSpread);
    this.startDelay = startDelay + propertyVariation(0, seed, 10) * startDelaySpread;
  }

  public get state(): EmitterState {
    return this.currentState;
  }

  /** Whether the next positive-time step is eligible to emit particles. */
  public get emitting(): boolean {
    return !this.emissionStopped && (!this.waitingForDelay || this.delayReached);
  }

  /** Current emitter age after delay and loop handling; zero duration samples the start. */
  public get normalizedAge(): number {
    return this.waitingForDelay || this.duration === 0 ? 0 : this.elapsed / this.duration;
  }

  /** Modifiers use the authored duration, even when spread extends the sampled clock. */
  public get modifierAge(): number {
    return this.authoredDuration === 0 ? 0 : this.elapsed / this.authoredDuration;
  }

  /** Drain queued state changes in order; repeated states do not enqueue events. */
  public takeTransitions(): EmitterState[] {
    const transitions = this.transitions;
    this.transitions = [];
    return transitions;
  }

  /** Disable the next loop without changing the current clock or state. */
  public retire(): void {
    this.retireAfterLoop = true;
  }

  /** Stop births immediately; existing particles may continue draining. */
  public stop(): void {
    this.retireAfterLoop = false;
    if (this.currentState !== 'sleeping') {
      this.emissionStopped = true;
      this.setState('postspawn');
    }
  }

  /** Enter sleeping only after emission has stopped and the caller reports no particles. */
  public finish(empty: boolean): void {
    if (empty && this.currentState === 'postspawn') {
      this.setState('sleeping');
    }
  }

  /**
   * Advance one step and return whether that entire step should emit.
   * A step that crosses the delay still waits; emission starts on the next step.
   * A step that reaches duration still emits, even if it stops or wraps the clock.
   * Zero-time initialization and sleeping never advance the clock or emit.
   */
  public advance(seconds: number): boolean {
    if (seconds === 0 || this.currentState === 'sleeping') {
      return false;
    }

    if (this.emissionStopped) {
      // Keep emitter-time curves moving while particles drain, up to duration.
      this.elapsed = Math.min(this.elapsed + seconds, this.duration);
      return false;
    }

    if (this.waitingForDelay) {
      // Check the delay before advancing the frame clock.
      if (!this.delayReached) {
        this.elapsed += seconds;
        return false;
      }
      // Preserve delay overshoot, including a negative sampled delay.
      this.elapsed = Math.max(0, this.elapsed - this.startDelay);
      this.waitingForDelay = false;
      this.setState('spawning');
    }

    this.emissionStartAge = this.normalizedAge;
    this.elapsed = Math.min(this.elapsed + seconds, this.duration);
    this.emissionEndAge = this.normalizedAge;
    if (this.durationReached) {
      if (this.playMode === 'loop' && !this.retireAfterLoop) {
        // Discard duration overshoot; start delay only applies after reset.
        this.elapsed = 0;
      } else {
        this.stop();
      }
    }

    return true;
  }

  /** Restart the delay and cancel stop/retirement, keeping the sampled timing values. */
  public reset(): void {
    this.elapsed = 0;
    this.emissionStartAge = 0;
    this.emissionEndAge = 0;
    this.emissionStopped = false;
    this.retireAfterLoop = false;
    this.waitingForDelay = true;
    this.setState('prespawn');
  }

  private setState(state: EmitterState): void {
    if (state !== this.currentState) {
      this.currentState = state;
      this.transitions.push(state);
    }
  }

  // Tolerances prevent decimal accumulation from adding a spurious boundary frame.
  private get delayReached(): boolean {
    const tolerance = Number.EPSILON * Math.max(1, this.startDelay) * 4;
    return this.startDelay - this.elapsed <= tolerance;
  }

  private get durationReached(): boolean {
    const tolerance = Number.EPSILON * Math.max(1, this.duration) * 4;
    return this.duration - this.elapsed <= tolerance;
  }
}
