import type { EmitterConfig } from '#types/effect.js';

/** Frame-based emitter timing; particle lifetime is independent of this clock. */
export class EmitterPlayback {
  private elapsed = 0;
  private finished = false;

  constructor(
    private readonly duration: number,
    private readonly playMode: EmitterConfig['playMode'],
  ) {}

  get emitting(): boolean {
    return !this.finished;
  }

  /** Defold emits the whole boundary frame, then stops or restarts its timer. */
  advance(seconds: number): boolean {
    if (seconds === 0 || this.finished) {
      return false;
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

  reset(): void {
    this.elapsed = 0;
    this.finished = false;
  }
}
