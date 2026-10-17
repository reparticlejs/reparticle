import type { EmitterConfig } from '#types/effect.js';

/** Frame-based emitter timing; particle lifetime is independent of this clock. */
export class EmitterPlayback {
  private elapsed = 0;
  private finished = false;
  private waiting = true;

  constructor(
    private readonly duration: number,
    private readonly playMode: EmitterConfig['playMode'],
    private readonly startDelay = 0,
  ) {}

  get emitting(): boolean {
    return !this.finished && (!this.waiting || this.delayReached);
  }

  /** Current emitter age after delay and loop handling; zero duration samples the start. */
  get normalizedAge(): number {
    return this.waiting || this.duration === 0 ? 0 : this.elapsed / this.duration;
  }

  /** Defold emits the whole boundary frame, then stops or restarts its timer. */
  advance(seconds: number): boolean {
    if (seconds === 0 || this.finished) {
      return false;
    }
    if (this.waiting) {
      // Defold checks the delay before advancing the frame clock.
      if (!this.delayReached) {
        this.elapsed += seconds;
        return false;
      }
      this.elapsed = Math.max(0, this.elapsed - this.startDelay);
      this.waiting = false;
    }
    this.elapsed = Math.min(this.elapsed + seconds, this.duration);
    // Avoid an extra frame caused solely by floating-point accumulation.
    if (this.duration - this.elapsed <= Number.EPSILON * Math.max(1, this.duration) * 4) {
      if (this.playMode === 'loop') {
        this.elapsed = 0;
      } else {
        this.finished = true;
      }
    }
    return true;
  }

  private get delayReached(): boolean {
    return this.startDelay - this.elapsed <= Number.EPSILON * Math.max(1, this.startDelay) * 4;
  }

  reset(): void {
    this.elapsed = 0;
    this.finished = false;
    this.waiting = true;
  }
}
