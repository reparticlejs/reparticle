import { modifiersSchema } from '#config/schemas/definition/modifiers.js';
import { SampledCurve } from '#curves/sampled-curve.js';
import type { ModifierConfig } from '#types/effect.js';

const MODIFIER_TYPES = { acceleration: 0, drag: 1, radial: 2, vortex: 3 } as const;
const COUNT_INDEX = 0;
const RADIAL_FLAG_INDEX = 1;

const FIELDS = {
  type: 0,
  magnitude: 1,
  spread: 2,
  centerX: 3,
  centerY: 4,
  directionX: 5,
  directionY: 6,
  cutoff: 7,
  directional: 8,
} as const;

import {
  MODIFIER_HEADER as HEADER_SIZE,
  MODIFIER_STRIDE,
  MAX_MODIFIERS,
} from '#simulation/layout.js';
/** Space for both 64-entry scopes: emitter modifiers followed by effect modifiers. */
export const MODIFIER_BUFFER_SIZE = HEADER_SIZE + MAX_MODIFIERS * MODIFIER_STRIDE;

// Buffer header: [active count, contains radial modifier]. Each entry stores:
// [type, magnitude, spread, centerX, centerY, directionX, directionY, cutoff, directional].
// This layout must match simulation/modifiers/dispatch.ts.

/**
 * One authored scope of modifiers, validated and sampled at construction.
 * write() evaluates the cached magnitude curves and appends GPU records in order.
 * It reuses the caller's buffer without allocating per-modifier objects.
 */
export class ModifierList {
  private readonly definitions: ModifierConfig[];
  private readonly magnitudes: SampledCurve[];

  public constructor(input: unknown) {
    this.definitions = modifiersSchema.parse(input);
    this.magnitudes = this.definitions.map(({ magnitude }) => new SampledCurve(magnitude));
  }

  /**
   * Append active modifiers after any records already written to the buffer.
   * The caller resets the header once before writing both scopes.
   * Origin, rotation (counterclockwise degrees), scale, and handedness map this
   * list's authored coordinates into the particle simulation space.
   * Magnitudes use emitter age and may extend beyond the end of their curves.
   * Zero magnitude with zero spread contributes nothing and is skipped.
   */
  public write(
    values: Float32Array,
    emitterAge: number,
    originX: number,
    originY: number,
    rotationDegrees: number,
    scale: number,
    handedness = 1,
  ): void {
    // Canvas Y points down, so counterclockwise angles use a negative sign.
    const radians = (-rotationDegrees * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);

    for (let index = 0; index < this.definitions.length; index++) {
      const modifier = this.definitions[index]!;
      const magnitude = this.magnitudes[index]!.extrapolate(emitterAge);
      if (magnitude === 0 && modifier.spread === 0) {
        continue;
      }

      const modifierRotation = 'rotation' in modifier ? modifier.rotation : 0;
      const directionAngle = radians - (modifierRotation * handedness * Math.PI) / 180;
      const strengthScale = getStrengthScale(modifier.type, scale, handedness);

      // Only radial and vortex modifiers have an authored center.
      let centerX = originX;
      let centerY = originY;
      if ('x' in modifier) {
        centerX += (cosine * modifier.x * handedness - sine * modifier.y) * scale;
        centerY += (sine * modifier.x * handedness + cosine * modifier.y) * scale;
      }

      const cutoff = 'maxDistance' in modifier ? modifier.maxDistance * Math.abs(scale) : 0;
      const directional = modifier.type === 'drag' && modifier.useDirection;
      const offset = HEADER_SIZE + values[COUNT_INDEX]! * MODIFIER_STRIDE;

      values[offset + FIELDS.type] = MODIFIER_TYPES[modifier.type];
      values[offset + FIELDS.magnitude] = magnitude * strengthScale;
      values[offset + FIELDS.spread] = modifier.spread * strengthScale;
      values[offset + FIELDS.centerX] = centerX;
      values[offset + FIELDS.centerY] = centerY;
      this.writeDirection(values, offset, modifier.type, directionAngle, handedness);
      values[offset + FIELDS.cutoff] = cutoff;
      values[offset + FIELDS.directional] = directional ? 1 : 0;

      if (modifier.type === 'radial') {
        values[RADIAL_FLAG_INDEX] = 1;
      }
      values[COUNT_INDEX] = values[COUNT_INDEX]! + 1;
    }
  }

  /** Write the force axis, or the vortex fallback direction at its center. */
  private writeDirection(
    values: Float32Array,
    offset: number,
    type: ModifierConfig['type'],
    angle: number,
    handedness: number,
  ): void {
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);

    switch (type) {
      case 'acceleration':
        // Acceleration points along authored -Y.
        values[offset + FIELDS.directionX] = sine;
        values[offset + FIELDS.directionY] = -cosine;
        break;
      case 'vortex':
        // At the exact vortex center, use authored -X as the fallback force.
        values[offset + FIELDS.directionX] = -cosine;
        values[offset + FIELDS.directionY] = -sine;
        break;
      default:
        // Directional drag uses authored +X; radial does not read this axis.
        values[offset + FIELDS.directionX] = cosine * handedness;
        values[offset + FIELDS.directionY] = sine * handedness;
    }
  }
}

/** Drag ignores scale; reflection reverses vortex circulation. */
function getStrengthScale(type: ModifierConfig['type'], scale: number, handedness: number): number {
  switch (type) {
    case 'drag':
      return 1;
    case 'vortex':
      return scale * handedness;
    default:
      return scale;
  }
}
