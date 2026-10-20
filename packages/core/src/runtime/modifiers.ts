import type { ModifierConfig } from '#types/effect.js';

import { modifiersSchema } from '../config/schema';
import { SampledCurve } from '../curves/sampled-curve';
import type { EffectTransform } from './effect-transform';

const kinds = { acceleration: 0, drag: 1, radial: 2, vortex: 3 };

/** Samples authored modifiers once per emitter frame, never per particle. */
class ModifierList {
  private readonly definitions: ModifierConfig[];
  private readonly magnitudes: SampledCurve[];

  public constructor(input: unknown) {
    this.definitions = modifiersSchema.parse(input);
    this.magnitudes = this.definitions.map(({ magnitude }) => new SampledCurve(magnitude));
  }

  public write(
    values: Float32Array,
    age: number,
    x: number,
    y: number,
    rotation: number,
    scale: number,
    handedness = 1,
  ): void {
    const radians = (-rotation * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    for (let index = 0; index < this.definitions.length; index++) {
      const modifier = this.definitions[index]!;
      const magnitude = this.magnitudes[index]!.extrapolate(age);
      if (magnitude === 0 && modifier.spread === 0) {
        continue;
      }
      const offset = 2 + values[0]! * 9;
      const angle =
        radians - (('rotation' in modifier ? modifier.rotation : 0) * handedness * Math.PI) / 180;
      const strengthScale =
        modifier.type === 'drag' ? 1 : scale * (modifier.type === 'vortex' ? handedness : 1);
      if (modifier.type === 'radial') {
        values[1] = 1;
      }
      values[offset] = kinds[modifier.type];
      values[offset + 1] = magnitude * strengthScale;
      values[offset + 2] = modifier.spread * strengthScale;
      values[offset + 3] = x;
      values[offset + 4] = y;
      if ('x' in modifier) {
        values[offset + 3] = x + (cosine * modifier.x * handedness - sine * modifier.y) * scale;
        values[offset + 4] = y + (sine * modifier.x * handedness + cosine * modifier.y) * scale;
      }
      values[offset + 5] = Math.cos(angle) * handedness;
      values[offset + 6] = Math.sin(angle) * handedness;
      if (modifier.type === 'acceleration') {
        values[offset + 5] = Math.sin(angle);
        values[offset + 6] = -Math.cos(angle);
      } else if (modifier.type === 'vortex') {
        values[offset + 5] = -Math.cos(angle);
        values[offset + 6] = -Math.sin(angle);
      }
      values[offset + 7] = 'maxDistance' in modifier ? modifier.maxDistance * Math.abs(scale) : 0;
      values[offset + 8] = modifier.type === 'drag' && modifier.useDirection ? 1 : 0;
      values[0] = values[0]! + 1;
    }
  }
}

/** Emitter order followed by effect order, in the particle's simulation space. */
export class Modifiers {
  private readonly local: ModifierList;
  private readonly shared: ModifierList;
  // Count and radial flag, then nine floats per entry: type, magnitude, spread, center XY, direction XY, cutoff, directional.
  private readonly values = new Float32Array(2 + 128 * 9);

  public constructor(local: unknown = [], shared: unknown = []) {
    this.local = new ModifierList(local);
    this.shared = new ModifierList(shared);
  }

  public sample(
    age: number,
    localSpace: boolean,
    x: number,
    y: number,
    rotation: number,
    scale: number,
    effect: EffectTransform,
  ): Float32Array {
    this.values[0] = 0;
    this.values[1] = 0;
    if (localSpace) {
      this.local.write(this.values, age, 0, 0, 0, 1);
      if (scale !== 0) {
        const radians = (rotation * Math.PI) / 180;
        const inverseScale = 1 / scale;
        // A negative uniform scale is a half-turn plus a positive scale.
        this.shared.write(
          this.values,
          age,
          (-Math.cos(radians) * x + Math.sin(radians) * y) * inverseScale,
          (-Math.sin(radians) * x - Math.cos(radians) * y) * inverseScale,
          -rotation + (scale < 0 ? 180 : 0),
          Math.abs(inverseScale),
        );
      }
    } else {
      this.local.write(
        this.values,
        age,
        effect.applyX(x, y),
        effect.applyY(x, y),
        rotation * effect.handedness + effect.rotation,
        scale * effect.scale,
        effect.handedness,
      );
      this.shared.write(
        this.values,
        age,
        effect.x,
        effect.y,
        effect.rotation,
        effect.scale,
        effect.handedness,
      );
    }
    return this.values;
  }
}
