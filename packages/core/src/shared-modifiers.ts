import type { ModifierConfig } from '#types/effect.js';

import { modifiersSchema } from './config/schema';
import { SampledCurve } from './curves/sampled-curve';
import type { EffectTransform } from './effect-transform';

/** Effect-space modifiers sampled on each receiving emitter's own timeline. */
export class SharedModifiers {
  private readonly config: ModifierConfig;
  private readonly enabled: boolean;
  private readonly acceleration: SampledCurve;
  private readonly drag: SampledCurve;
  private readonly radial: SampledCurve;
  private readonly vortex: SampledCurve;
  private readonly values = new Float32Array(24);

  constructor(definition: unknown = {}) {
    this.config = modifiersSchema.parse(definition);
    this.enabled = Object.values(this.config).some(
      ({ magnitude, spread }) => magnitude !== 0 || spread !== 0,
    );
    this.acceleration = new SampledCurve(this.config.acceleration.magnitude);
    this.drag = new SampledCurve(this.config.drag.magnitude);
    this.radial = new SampledCurve(this.config.radial.magnitude);
    this.vortex = new SampledCurve(this.config.vortex.magnitude);
  }

  sample(
    age: number,
    local: boolean,
    x: number,
    y: number,
    rotation: number,
    scale: number,
    effect?: EffectTransform,
  ): Float32Array {
    if (!this.enabled) {
      return this.values;
    }
    if (local && scale === 0) {
      this.values.fill(0);
      return this.values;
    }
    const { acceleration, drag, radial, vortex } = this.config;
    const inverseScale = local && scale !== 0 ? 1 / scale : 1;
    const radians = local ? (rotation * Math.PI) / 180 : 0;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const accelerationAngle = radians - (acceleration.rotation * Math.PI) / 180;
    const dragAngle = radians - (drag.rotation * Math.PI) / 180;
    const vortexAngle = radians - (vortex.rotation * Math.PI) / 180;
    const radialX = radial.x - (local ? x : 0);
    const radialY = radial.y - (local ? y : 0);
    const vortexX = vortex.x - (local ? x : 0);
    const vortexY = vortex.y - (local ? y : 0);
    const values = this.values;
    values.set([
      0,
      this.acceleration.at(age) * inverseScale,
      acceleration.spread * inverseScale,
      Math.sin(accelerationAngle),
      -Math.cos(accelerationAngle),
      this.drag.at(age),
      drag.spread,
      drag.useDirection ? 1 : 0,
      Math.cos(dragAngle),
      Math.sin(dragAngle),
      this.radial.at(age) * Math.abs(inverseScale),
      radial.spread * Math.abs(inverseScale),
      (cosine * radialX - sine * radialY) * inverseScale,
      (sine * radialX + cosine * radialY) * inverseScale,
      radial.maxDistance * Math.abs(inverseScale),
      this.vortex.at(age) * Math.abs(inverseScale),
      vortex.spread * Math.abs(inverseScale),
      (cosine * vortexX - sine * vortexY) * inverseScale,
      (sine * vortexX + cosine * vortexY) * inverseScale,
      vortex.maxDistance * Math.abs(inverseScale),
      -Math.cos(vortexAngle) * Math.sign(inverseScale),
      -Math.sin(vortexAngle) * Math.sign(inverseScale),
      0,
      0,
    ]);
    values[0] =
      values[1] !== 0 ||
      values[2] !== 0 ||
      values[5] !== 0 ||
      values[6] !== 0 ||
      values[10] !== 0 ||
      values[11] !== 0 ||
      values[15] !== 0 ||
      values[16] !== 0
        ? 1
        : 0;
    if (!local && effect) {
      const angle = (-effect.rotation * Math.PI) / 180;
      const effectCosine = Math.cos(angle);
      const effectSine = Math.sin(angle);
      for (const index of [3, 8, 20]) {
        const componentX = values[index]!;
        const componentY = values[index + 1]!;
        values[index] = effectCosine * componentX - effectSine * componentY;
        values[index + 1] = effectSine * componentX + effectCosine * componentY;
      }
      for (const index of [12, 17]) {
        const componentX = values[index]!;
        const componentY = values[index + 1]!;
        values[index] = effect.applyX(componentX, componentY);
        values[index + 1] = effect.applyY(componentX, componentY);
      }
      for (const index of [1, 2, 10, 11, 14, 15, 16, 19]) {
        values[index] = values[index]! * effect.scale;
      }
    }
    return values;
  }
}
