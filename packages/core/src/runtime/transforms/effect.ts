import type { Transform } from '#types/transform.js';

/**
 * Shared transform from effect-local coordinates to world coordinates.
 * Reflect local X when handedness is -1, then rotate, scale, and translate.
 * Rotation is in degrees, counterclockwise on a canvas whose Y axis points down.
 */
export class EffectTransform {
  private value: Transform = { x: 0, y: 0, rotation: 0, scale: 1, handedness: 1 };

  public get x(): number {
    return this.value.x;
  }

  public set x(value: number) {
    this.set({ x: value });
  }

  public get y(): number {
    return this.value.y;
  }

  public set y(value: number) {
    this.set({ y: value });
  }

  public get rotation(): number {
    return this.value.rotation;
  }

  public set rotation(value: number) {
    this.set({ rotation: value });
  }

  /** Uniform scale; zero collapses to the origin, negative values invert both axes. */
  public get scale(): number {
    return this.value.scale;
  }

  public set scale(value: number) {
    this.set({ scale: value });
  }

  /** 1 preserves orientation; -1 reflects the local X axis. */
  public get handedness(): 1 | -1 {
    return this.value.handedness;
  }

  public set handedness(value: 1 | -1) {
    this.set({ handedness: value });
  }

  /** Validate the entire patch before committing; rejected patches leave all values intact. */
  public set(patch: Partial<Transform>): void {
    const next = { ...this.value, ...patch };
    if (!Object.values(next).every(Number.isFinite)) {
      throw new RangeError('Effect transform must contain finite numbers');
    }
    if (next.handedness !== 1 && next.handedness !== -1) {
      throw new RangeError('Effect transform handedness must be 1 or -1');
    }
    this.value = next;
  }

  /** World X of a local point. Returns one coordinate without allocating a point object. */
  public applyX(localX: number, localY: number): number {
    // Negate the angle because canvas Y increases downward.
    const radians = (-this.rotation * Math.PI) / 180;
    const reflectedX = localX * this.handedness;
    const rotatedX = Math.cos(radians) * reflectedX - Math.sin(radians) * localY;
    return this.x + rotatedX * this.scale;
  }

  /** World Y of a local point, using the same transform order as applyX. */
  public applyY(localX: number, localY: number): number {
    const radians = (-this.rotation * Math.PI) / 180;
    const reflectedX = localX * this.handedness;
    const rotatedY = Math.sin(radians) * reflectedX + Math.cos(radians) * localY;
    return this.y + rotatedY * this.scale;
  }
}
