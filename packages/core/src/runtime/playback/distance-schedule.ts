const BIRTH_ROUNDING_TOLERANCE = 1e-9;

/**
 * Request particles at regular intervals along the emitter's travelled path.
 *
 * Distance is measured in world units. Each segment contributes distance × rate
 * births; unfinished births carry into the next segment. For example, at one
 * particle per two units, two successive one-unit moves produce one particle.
 *
 * This class schedules births only. The slot allocator limits admission, and the
 * GPU uses the segment and birth fractions to place the accepted particles.
 * No positions, arrays, or GPU resources are allocated during playback.
 */
export class DistanceSchedule {
  /** World-space travel from the previous sample to the current one. */
  public displacementX = 0;
  public displacementY = 0;

  /**
   * Position of the first requested birth along this segment: 0 = start, 1 = end.
   * Read only when next() returns births; an unfinished birth can lie beyond 1.
   */
  public firstBirthFraction = 0;

  /** Fraction of the segment between consecutive births; multiplied by birth index. */
  public birthFractionStep = 0;

  private previousX = 0;
  private previousY = 0;
  private hasPreviousPosition = false;
  private fractionalBirths = 0;

  /** Capacity caps requests per step; currently free slots are checked separately. */
  public constructor(private readonly capacity: number) {}

  /**
   * Record movement and return the number of whole-particle requests it produces.
   *
   * Call once per positive simulation update, excluding stationary prewarm.
   * The first call establishes the position and emits nothing. Pass rate zero
   * during delay or disabled emission: movement is tracked but cannot accumulate
   * a backlog. Any existing fractional birth is retained until emission resumes.
   *
   * Positions and the nonnegative particles-per-world-unit rate are validated by
   * the caller. Reset when restarting so the old position is not connected to it.
   */
  public next(worldX: number, worldY: number, particlesPerUnit: number): number {
    this.recordPosition(worldX, worldY);
    this.firstBirthFraction = 0;
    this.birthFractionStep = 0;

    const distance = Math.hypot(this.displacementX, this.displacementY);
    const segmentBirths = distance * particlesPerUnit;
    if (segmentBirths === 0) {
      return 0;
    }

    // Finish the carried birth first, then place one birth per full interval.
    const remainingBirthFraction = 1 - this.fractionalBirths;
    this.firstBirthFraction = remainingBirthFraction / segmentBirths;
    this.birthFractionStep = 1 / segmentBirths;

    // Avoid delaying a birth when decimal accumulation lands just below an integer.
    const accumulatedBirths = this.fractionalBirths + segmentBirths;
    const wholeBirths = Math.floor(accumulatedBirths + BIRTH_ROUNDING_TOLERANCE);
    this.fractionalBirths = Math.max(0, accumulatedBirths - wholeBirths);

    // Consume all whole births before capping requests: overflow is never deferred.
    return Math.min(this.capacity, wholeBirths);
  }

  /** Clear carry and travel history; the next sample establishes a new starting point. */
  public reset(): void {
    this.hasPreviousPosition = false;
    this.fractionalBirths = 0;
    this.displacementX = 0;
    this.displacementY = 0;
    this.firstBirthFraction = 0;
    this.birthFractionStep = 0;
  }

  /** Track even disabled movement, without treating the first position as travel. */
  private recordPosition(worldX: number, worldY: number): void {
    this.displacementX = this.hasPreviousPosition ? worldX - this.previousX : 0;
    this.displacementY = this.hasPreviousPosition ? worldY - this.previousY : 0;
    this.previousX = worldX;
    this.previousY = worldY;
    this.hasPreviousPosition = true;
  }
}
