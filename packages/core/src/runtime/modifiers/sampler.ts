import type { EffectTransform } from '#runtime/transforms/effect.js';

import { ModifierList, MODIFIER_BUFFER_SIZE } from './list';

/**
 * Prepare modifier inputs once per emitter step, never per particle.
 * Emitter modifiers run first, followed by shared effect modifiers; each list
 * preserves its authored order. Their transforms match the particle space.
 */
export class ModifierSampler {
  private readonly emitterModifiers: ModifierList;
  private readonly effectModifiers: ModifierList;
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
    this.buffer[0] = 0;
    this.buffer[1] = 0;

    if (localParticleSpace) {
      this.sampleLocalSpace(modifierAge, emitterX, emitterY, emitterRotation, emitterScale);
    } else {
      this.sampleWorldSpace(modifierAge, emitterX, emitterY, emitterRotation, emitterScale, effect);
    }

    return this.buffer;
  }

  private sampleLocalSpace(
    modifierAge: number,
    emitterX: number,
    emitterY: number,
    emitterRotation: number,
    emitterScale: number,
  ): void {
    // Emitter modifiers already use emitter-local coordinates.
    this.emitterModifiers.write(this.buffer, modifierAge, 0, 0, 0, 1);
    // Zero scale has no inverse. Emitter-local modifiers still apply above.
    if (emitterScale === 0) {
      return;
    }

    // Undo emitter translation, rotation, and scale to map effect → emitter space.
    const radians = (emitterRotation * Math.PI) / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const inverseScale = 1 / emitterScale;
    const inverseX = (-cosine * emitterX + sine * emitterY) * inverseScale;
    const inverseY = (-sine * emitterX - cosine * emitterY) * inverseScale;

    // Represent negative uniform scale as a half-turn plus a positive scale.
    const inverseRotation = -emitterRotation + (emitterScale < 0 ? 180 : 0);
    const inverseMagnitudeScale = Math.abs(inverseScale);
    this.effectModifiers.write(
      this.buffer,
      modifierAge,
      inverseX,
      inverseY,
      inverseRotation,
      inverseMagnitudeScale,
    );
  }

  private sampleWorldSpace(
    modifierAge: number,
    emitterX: number,
    emitterY: number,
    emitterRotation: number,
    emitterScale: number,
    effect: EffectTransform,
  ): void {
    // Compose emitter → effect → world once for the emitter-owned modifier list.
    const worldX = effect.applyX(emitterX, emitterY);
    const worldY = effect.applyY(emitterX, emitterY);
    const worldRotation = emitterRotation * effect.handedness + effect.rotation;
    const worldScale = emitterScale * effect.scale;
    this.emitterModifiers.write(
      this.buffer,
      modifierAge,
      worldX,
      worldY,
      worldRotation,
      worldScale,
      effect.handedness,
    );

    // Shared modifiers use the effect-to-world transform directly.
    this.effectModifiers.write(
      this.buffer,
      modifierAge,
      effect.x,
      effect.y,
      effect.rotation,
      effect.scale,
      effect.handedness,
    );
  }
}
