import type { EmitterConfig } from '#types/effect.js';

import { propertyVariation } from '../../simulation/emission/variation';

/**
 * Convert timed bursts into particle requests for each simulation step.
 *
 * Playback owns the clock, delay, and looping. This schedule only remembers which
 * bursts have already fired in the current cycle. ParticleSlots then decides how
 * many requested particles fit in the available slots.
 *
 * Definitions are validated before construction and sorted once. Advancing the
 * schedule does not allocate arrays or access GPU data. Count spread is sampled
 * per occurrence, rounded to a whole particle, and clamped to zero. Reset replays
 * the same seeded sequence, independent of how simulation steps group events.
 */
export class BurstSchedule {
  private readonly bursts: EmitterConfig['emission']['bursts'];
  private currentCycle: number | undefined;
  private nextBurstIndex = 0;
  private occurrence = 0;

  public constructor(
    bursts: EmitterConfig['emission']['bursts'],
    private readonly capacity: number,
    private readonly seed = 0,
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
      // Sample each occurrence, including disabled or capacity-dropped events.
      // A dedicated stream keeps this independent of particle-property randomness.
      const variation = propertyVariation(this.occurrence, this.seed, 11);
      const count = Math.max(0, Math.round(burst.count + variation * burst.countSpread));
      requestedBirths = Math.min(this.capacity, requestedBirths + count);
      this.occurrence += 1;

      // Consume even after reaching capacity: excess births are dropped, never queued.
      this.nextBurstIndex += 1;
      burst = this.bursts[this.nextBurstIndex];
    }

    return requestedBirths;
  }

  /** Forget consumed events so restart can replay every burst, including time zero. */
  public reset(): void {
    this.currentCycle = undefined;
    this.occurrence = 0;
    this.nextBurstIndex = 0;
  }
}
