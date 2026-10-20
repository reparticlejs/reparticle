/** Accumulates fractional emission; admission into free slots happens separately. */
export class SpawnSchedule {
  private carry = 0;
  public constructor(public readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1_000_000) {
      throw new RangeError('Capacity must be an integer from 1 to 1,000,000');
    }
  }
  public next(rate: number, dt: number): number {
    if (!Number.isFinite(dt) || dt < 0 || dt > 0.1) {
      throw new RangeError('Step must be between 0 and 0.1 seconds');
    }
    if (!Number.isFinite(rate) || rate < 0) {
      throw new RangeError('Rate must be finite and nonnegative');
    }
    const total = this.carry + rate * dt;
    const whole = Math.floor(total + 1e-9);
    this.carry = Math.max(0, total - whole);
    return Math.min(whole, this.capacity);
  }
  public reset(): void {
    this.carry = 0;
  }
}
