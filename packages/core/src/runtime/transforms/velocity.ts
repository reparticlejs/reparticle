/**
 * Estimate emitter world velocity from successive position samples.
 * New world-space particles can inherit a scaled copy of this velocity;
 * this class neither tracks particle motion nor applies the inheritance factor.
 */
export class EmitterVelocity {
  /** Horizontal world velocity in units per second. */
  public x = 0;

  /** Vertical world velocity in units per second. */
  public y = 0;

  private previousX = 0;
  private previousY = 0;
  private hasPreviousPosition = false;

  /**
   * Record the current world position and elapsed time since the previous sample.
   * The first sample establishes a position without producing velocity.
   * Nonpositive time records the position but preserves the last velocity,
   * allowing zero-time initialization without division by zero.
   */
  public update(worldX: number, worldY: number, seconds: number): void {
    if (this.hasPreviousPosition && seconds > 0) {
      const displacementX = worldX - this.previousX;
      const displacementY = worldY - this.previousY;
      this.x = displacementX / seconds;
      this.y = displacementY / seconds;
    }

    this.previousX = worldX;
    this.previousY = worldY;
    this.hasPreviousPosition = true;
  }

  /** Clear velocity and history so the next position starts a fresh measurement. */
  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.hasPreviousPosition = false;
  }
}
