import type { EmitterConfig } from '#types/effect.js';
import type { EmitterState } from '#types/lifecycle.js';
import type { PlaybackVariation } from '#types/playback.js';

import { propertyVariation } from '../simulation/emission/variation';

/** Frame-based emitter timing; particle lifetime is independent of this clock. */
export class EmitterPlayback {
  private elapsed = 0;
  private finished = false;
  private retiring = false;
  private waiting = true;
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
    // Emitter-level samples stay fixed across loops and resets.
    this.duration = Math.max(0, authoredDuration + propertyVariation(0, seed, 9) * durationSpread);
    this.startDelay = startDelay + propertyVariation(0, seed, 10) * startDelaySpread;
  }

  public get state(): EmitterState {
    return this.currentState;
  }

  public takeTransitions(): EmitterState[] {
    const transitions = this.transitions;
    this.transitions = [];
    return transitions;
  }

  /** Disable the next loop without changing the current clock or state. */
  public retire(): void {
    this.retiring = true;
  }

  public stop(): void {
    this.retiring = false;
    if (this.currentState !== 'sleeping') {
      this.finished = true;
      this.setState('postspawn');
    }
  }

  public finish(empty: boolean): void {
    if (empty && this.currentState === 'postspawn') {
      this.setState('sleeping');
    }
  }

  public get emitting(): boolean {
    return !this.finished && (!this.waiting || this.delayReached);
  }

  /** Current emitter age after delay and loop handling; zero duration samples the start. */
  public get normalizedAge(): number {
    return this.waiting || this.duration === 0 ? 0 : this.elapsed / this.duration;
  }

  /** Modifiers use the authored duration, even when spread extends the sampled clock. */
  public get modifierAge(): number {
    return this.authoredDuration === 0 ? 0 : this.elapsed / this.authoredDuration;
  }

  /** Emit the whole boundary frame, then stop or restart the timer. */
  public advance(seconds: number): boolean {
    if (seconds === 0 || this.currentState === 'sleeping') {
      return false;
    }
    if (this.finished) {
      this.elapsed = Math.min(this.elapsed + seconds, this.duration);
      return false;
    }
    if (this.waiting) {
      // Check the delay before advancing the frame clock.
      if (!this.delayReached) {
        this.elapsed += seconds;
        return false;
      }
      this.elapsed = Math.max(0, this.elapsed - this.startDelay);
      this.waiting = false;
      this.setState('spawning');
    }
    this.elapsed = Math.min(this.elapsed + seconds, this.duration);
    // Avoid an extra frame caused solely by floating-point accumulation.
    if (this.duration - this.elapsed <= Number.EPSILON * Math.max(1, this.duration) * 4) {
      if (this.playMode === 'loop' && !this.retiring) {
        this.elapsed = 0;
      } else {
        this.stop();
      }
    }
    return true;
  }

  public reset(): void {
    this.elapsed = 0;
    this.finished = false;
    this.retiring = false;
    this.waiting = true;
    this.setState('prespawn');
  }

  private setState(state: EmitterState): void {
    if (state !== this.currentState) {
      this.currentState = state;
      this.transitions.push(state);
    }
  }

  private get delayReached(): boolean {
    return this.startDelay - this.elapsed <= Number.EPSILON * Math.max(1, this.startDelay) * 4;
  }
}
