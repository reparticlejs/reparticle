import type { Transform } from '#types/transform.js';

/** Shared simulation transform. Degrees are counterclockwise in canvas coordinates. */
export class EffectTransform {
  private value: Transform = { x: 0, y: 0, rotation: 0, scale: 1, handedness: 1 };

  set(patch: Partial<Transform>): void {
    const next = { ...this.value, ...patch };
    if (!Object.values(next).every(Number.isFinite)) {
      throw new RangeError('Effect transform must contain finite numbers');
    }
    if (next.handedness !== 1 && next.handedness !== -1) {
      throw new RangeError('Effect transform handedness must be 1 or -1');
    }
    this.value = next;
  }

  get x(): number {
    return this.value.x;
  }
  set x(value: number) {
    this.set({ x: value });
  }
  get y(): number {
    return this.value.y;
  }
  set y(value: number) {
    this.set({ y: value });
  }
  get rotation(): number {
    return this.value.rotation;
  }
  set rotation(value: number) {
    this.set({ rotation: value });
  }
  get scale(): number {
    return this.value.scale;
  }
  set scale(value: number) {
    this.set({ scale: value });
  }

  get handedness(): 1 | -1 {
    return this.value.handedness;
  }
  set handedness(value: 1 | -1) {
    this.set({ handedness: value });
  }

  applyX(x: number, y: number): number {
    const radians = (-this.rotation * Math.PI) / 180;
    return this.x + (Math.cos(radians) * x * this.handedness - Math.sin(radians) * y) * this.scale;
  }

  applyY(x: number, y: number): number {
    const radians = (-this.rotation * Math.PI) / 180;
    return this.y + (Math.sin(radians) * x * this.handedness + Math.cos(radians) * y) * this.scale;
  }
}
