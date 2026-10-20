/** Frame-to-frame emitter motion, independent of particle velocity. */
export class EmitterVelocity {
  x = 0;
  y = 0;
  private previousX = 0;
  private previousY = 0;
  private initialized = false;

  update(x: number, y: number, seconds: number): void {
    if (this.initialized && seconds > 0) {
      this.x = (x - this.previousX) / seconds;
      this.y = (y - this.previousY) / seconds;
    }
    this.previousX = x;
    this.previousY = y;
    this.initialized = true;
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.initialized = false;
  }
}
