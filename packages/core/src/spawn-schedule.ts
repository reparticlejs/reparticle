/** Constant-size CPU bookkeeping. No per-particle state or loops. */
export class SpawnSchedule {
  private carry = 0;
  private cursor = 0;
  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1_000_000) {
      throw new RangeError("Capacity must be an integer from 1 to 1,000,000");
    }
  }
  next(rate: number, dt: number): { start: number; count: number } {
    if (!Number.isFinite(dt) || dt < 0 || dt > 0.1)
      throw new RangeError("Step must be between 0 and 0.1 seconds");
    if (!Number.isFinite(rate) || rate < 0)
      throw new RangeError("Rate must be finite and nonnegative");
    const total = this.carry + rate * dt;
    const whole = Math.floor(total + 1e-9);
    this.carry = Math.max(0, total - whole);
    const count = Math.min(whole, this.capacity);
    const start = this.cursor;
    this.cursor = (this.cursor + count) % this.capacity;
    return { start, count };
  }
  reset(): void {
    this.carry = 0;
    this.cursor = 0;
  }
}
