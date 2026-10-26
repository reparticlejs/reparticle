import { modifiersSchema } from '#config/schemas/definition/modifiers.js';
import { SampledCurve } from '#curves/sampled-curve.js';
import {
  MODIFIER_HEADER,
  MODIFIER_STRIDE,
  MODIFIER_WORDS,
  MODIFIER_COUNT_INDEX,
  MODIFIER_RADIAL_FLAG_INDEX,
} from '#simulation/data-layout.js';
import type { ModifierConfig } from '#types/effect.js';
import type { SampledModifier } from '#types/modifier.js';
import type { Transform } from '#types/transform.js';

const MODIFIER_TYPES = { acceleration: 0, drag: 1, radial: 2, vortex: 3 } as const;

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

/** Space for emitter modifiers followed by effect modifiers. */
export const MODIFIER_BUFFER_SIZE = MODIFIER_WORDS;

// Buffer header: [active count, contains radial modifier]. Each entry stores:
// [type, magnitude, spread, centerX, centerY, directionX, directionY, cutoff, directional].
// This layout must match simulation/modifiers/dispatch.ts.

/**
 * Packs one authored modifier list into the simulation's shared input buffer.
 * Validate definitions and cache curves once; sample and transform them in write().
 * Records preserve authored order, including repeated modifier types.
 * It reuses the caller's buffer without allocating per-modifier objects.
 */
export class ModifierList {
  private readonly modifiers: SampledModifier[];

  public constructor(input: unknown) {
    this.modifiers = modifiersSchema.parse(input).map((definition) => ({
      definition,
      magnitude: new SampledCurve(definition.magnitude),
    }));
  }

  /**
   * Append active modifiers after any records already written to the buffer.
   * The caller resets the header once before writing both scopes.
   * Origin, rotation (counterclockwise degrees), scale, and handedness map this
   * list's authored coordinates into the particle simulation space.
   * The caller supplies modifier time (emitter age divided by duration).
   * Magnitude curves extrapolate when that time exceeds their final point.
   * Zero magnitude with zero spread contributes nothing and is skipped.
   */
  public write(values: Float32Array, modifierAge: number, transform: Readonly<Transform>): void {
    const { x: originX, y: originY, rotation, scale, handedness } = transform;
    // Canvas Y points down, so counterclockwise angles use a negative sign.
    const radians = (-rotation * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);

    for (const { definition: modifier, magnitude: curve } of this.modifiers) {
      const magnitude = curve.extrapolate(modifierAge);
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
      const count = values[MODIFIER_COUNT_INDEX]!;
      const offset = MODIFIER_HEADER + count * MODIFIER_STRIDE;

      // Append one complete record before publishing the new active count.
      values[offset + FIELDS.type] = MODIFIER_TYPES[modifier.type];
      values[offset + FIELDS.magnitude] = magnitude * strengthScale;
      values[offset + FIELDS.spread] = modifier.spread * strengthScale;
      values[offset + FIELDS.centerX] = centerX;
      values[offset + FIELDS.centerY] = centerY;
      this.writeDirection(values, offset, modifier.type, directionAngle, handedness);
      values[offset + FIELDS.cutoff] = cutoff;
      values[offset + FIELDS.directional] = directional ? 1 : 0;

      if (modifier.type === 'radial') {
        values[MODIFIER_RADIAL_FLAG_INDEX] = 1;
      }
      values[MODIFIER_COUNT_INDEX] = count + 1;
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
