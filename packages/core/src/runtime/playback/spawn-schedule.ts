const MAX_STEP_SECONDS = 0.1;
const BIRTH_ROUNDING_TOLERANCE = 1e-9;

/**
 * Convert a particles-per-second rate into whole-particle requests per step.
 * Fractional births carry into later steps; whole births above capacity are dropped.
 * ParticleSlots separately decides how many requests fit in currently free slots.
 */
export class SpawnSchedule {
  private fractionalBirths = 0;

  public constructor(public readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1_000_000) {
      throw new RangeError('Capacity must be an integer from 1 to 1,000,000');
    }
  }

  /** Request births for this step. Invalid input leaves the carried fraction unchanged. */
  public next(rate: number, seconds: number): number {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_STEP_SECONDS) {
      throw new RangeError('Step must be between 0 and 0.1 seconds');
    }
    if (!Number.isFinite(rate) || rate < 0) {
      throw new RangeError('Rate must be finite and nonnegative');
    }

    const accumulatedBirths = this.fractionalBirths + rate * seconds;

    // Avoid losing a birth when floating-point accumulation falls just below an integer.
    const wholeBirths = Math.floor(accumulatedBirths + BIRTH_ROUNDING_TOLERANCE);
    this.fractionalBirths = Math.max(0, accumulatedBirths - wholeBirths);

    // Apply capacity after removing whole births from the carry: no deferred backlog.
    return Math.min(wholeBirths, this.capacity);
  }

  /** Discard the carried fraction when playback restarts. */
  public reset(): void {
    this.fractionalBirths = 0;
  }
}
