import type { EmitterConfig } from '#types/effect.js';

/**
 * Convert timed bursts into particle requests for each simulation step.
 *
 * Playback owns the clock, delay, and looping. This schedule only remembers which
 * bursts have already fired in the current cycle. ParticleSlots then decides how
 * many requested particles fit in the available slots.
 *
 * Definitions are validated before construction and sorted once. Advancing the
 * schedule does not allocate arrays or access GPU data.
 */
export class BurstSchedule {
  private readonly bursts: EmitterConfig['emission']['bursts'];
  private currentCycle: number | undefined;
  private nextBurstIndex = 0;

  public constructor(
    bursts: EmitterConfig['emission']['bursts'],
    private readonly capacity: number,
  ) {
    // Preserve the authored order in the definition; equal times remain separate bursts.
    this.bursts = [...bursts].sort((left, right) => left.time - right.time);
  }

  /**
   * Request every unconsumed burst through the end of an active simulation step.
   *
   * @param emissionCycle Cycle that produced this step, before playback wraps.
   * @param emissionTime Seconds since emission began in that cycle, excluding delay.
   *
   * Time must advance within each cycle. Time-zero bursts fire on its first call.
   * Call only for active steps, including prewarm. When emission is disabled, still
   * call and discard the result so missed bursts do not accumulate for later.
   * Requests are capped at capacity; all due events are consumed even when full.
   */
  public next(emissionCycle: number, emissionTime: number): number {
    if (emissionCycle !== this.currentCycle) {
      this.currentCycle = emissionCycle;
      this.nextBurstIndex = 0;
    }

    // Match playback's rounding tolerance so decimal times do not slip by one frame.
    const timeTolerance = Number.EPSILON * Math.max(1, emissionTime) * 4;
    let requestedBirths = 0;
    let burst = this.bursts[this.nextBurstIndex];

    while (burst !== undefined && burst.time - emissionTime <= timeTolerance) {
      requestedBirths = Math.min(this.capacity, requestedBirths + burst.count);

      // Consume even after reaching capacity: excess births are dropped, never queued.
      this.nextBurstIndex += 1;
      burst = this.bursts[this.nextBurstIndex];
    }

    return requestedBirths;
  }

  /** Forget consumed events so restart can replay every burst, including time zero. */
  public reset(): void {
    this.currentCycle = undefined;
    this.nextBurstIndex = 0;
  }
}
