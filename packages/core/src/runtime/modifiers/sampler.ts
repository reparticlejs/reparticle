import type { EffectTransform } from '#runtime/transforms/effect.js';
import { MODIFIER_COUNT_INDEX, MODIFIER_RADIAL_FLAG_INDEX } from '#simulation/layout.js';
import type { Transform } from '#types/transform.js';

import { ModifierList, MODIFIER_BUFFER_SIZE } from './list';

const LOCAL_TRANSFORM: Readonly<Transform> = {
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  handedness: 1,
};

/**
 * Prepare modifier inputs once per emitter step, never per particle.
 * Emitter modifiers run first, followed by shared effect modifiers; each list
 * preserves its authored order. Their transforms match the particle space.
 */
export class ModifierSampler {
  private readonly emitterModifiers: ModifierList;
  private readonly effectModifiers: ModifierList;
  // Reused scratch space: transforming a list must not allocate on every step.
  private readonly emitterToWorld: Transform = {
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    handedness: 1,
  };
  private readonly effectToEmitter: Transform = {
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    handedness: 1,
  };
  private readonly buffer = new Float32Array(MODIFIER_BUFFER_SIZE);

  public constructor(emitterModifiers: unknown = [], effectModifiers: unknown = []) {
    this.emitterModifiers = new ModifierList(emitterModifiers);
    this.effectModifiers = new ModifierList(effectModifiers);
  }

  /**
   * Return the reused buffer; its contents remain valid only until the next call.
   * The header count bounds valid entries, so old trailing entries need no clearing.
   * modifierAge is emitter time divided by authored duration; it may exceed 1.
   * Emitter position, counterclockwise rotation (degrees), and signed uniform scale
   * are relative to the effect. effect maps effect coordinates into world space.
   * localParticleSpace selects emitter-local output; otherwise output is world-space.
   */
  public sample(
    modifierAge: number,
    localParticleSpace: boolean,
    emitterX: number,
    emitterY: number,
    emitterRotation: number,
    emitterScale: number,
    effect: EffectTransform,
  ): Float32Array {
    // Reset active count and radial flag; records beyond the new count are ignored.
    this.buffer[MODIFIER_COUNT_INDEX] = 0;
    this.buffer[MODIFIER_RADIAL_FLAG_INDEX] = 0;

    if (localParticleSpace) {
      this.sampleLocalSpace(modifierAge, emitterX, emitterY, emitterRotation, emitterScale);
    } else {
      this.sampleWorldSpace(modifierAge, emitterX, emitterY, emitterRotation, emitterScale, effect);
    }

    return this.buffer;
  }

  /** Emitter modifiers are already local; shared modifiers need the inverse emitter transform. */
  private sampleLocalSpace(
    modifierAge: number,
    emitterX: number,
    emitterY: number,
    emitterRotation: number,
    emitterScale: number,
  ): void {
    // Emitter modifiers already use emitter-local coordinates.
    this.emitterModifiers.write(this.buffer, modifierAge, LOCAL_TRANSFORM);
    // Zero scale has no inverse. Emitter-local modifiers still apply above.
    if (emitterScale === 0) {
      return;
    }

    // Undo emitter translation, rotation, and scale to map effect → emitter space.
    const radians = (emitterRotation * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const inverseScale = 1 / emitterScale;
    const transform = this.effectToEmitter;
    transform.x = (-cosine * emitterX + sine * emitterY) * inverseScale;
    transform.y = (-sine * emitterX - cosine * emitterY) * inverseScale;

    // Negative uniform scale flips both axes: a half-turn preserves that orientation.
    transform.rotation = -emitterRotation + (emitterScale < 0 ? 180 : 0);
    transform.scale = Math.abs(inverseScale);
    this.effectModifiers.write(this.buffer, modifierAge, transform);
  }

  /** Compose emitter → effect → world; shared modifiers only need effect → world. */
  private sampleWorldSpace(
    modifierAge: number,
    emitterX: number,
    emitterY: number,
    emitterRotation: number,
    emitterScale: number,
    effect: EffectTransform,
  ): void {
    const transform = this.emitterToWorld;
    transform.x = effect.applyX(emitterX, emitterY);
    transform.y = effect.applyY(emitterX, emitterY);
    transform.rotation = emitterRotation * effect.handedness + effect.rotation;
    transform.scale = emitterScale * effect.scale;
    transform.handedness = effect.handedness;

    this.emitterModifiers.write(this.buffer, modifierAge, transform);
    this.effectModifiers.write(this.buffer, modifierAge, effect);
  }
}
