import {
  parseEffectConfig,
  EffectTransform,
  Emitter,
  type EmitterState,
  type StopOptions,
} from '@reparticle/core';
import { Matrix, RenderContainer, type Texture } from 'pixi.js';

import type { ParticleRendering, ParticleTint } from '#types/particle-rendering.js';
import type { ParticleTexture } from '#types/particle-texture.js';
import type { ParticleViewOptions } from '#types/particle-view-options.js';

import type { ParticlePipe } from '../rendering/particle-pipe';
import { resolveTint } from '../rendering/resolve-tint';
import { resolveFlipbook } from '../textures/resolve-flipbook';
import { resolvePivot } from '../textures/resolve-pivot';
import { resolveTexture } from '../textures/resolve-texture';
import { resolveTextureFlip } from '../textures/resolve-texture-flip';
import type { EmitterView } from './emitter-view';

/** An effect display object. Bounds and hit areas remain opt-in; textures belong to the caller. */
export class ParticleView extends RenderContainer {
  private readonly effectTransform = new EffectTransform();
  private readonly sceneTransform = new Matrix();
  private readonly drawTransform = new Matrix();
  public override readonly renderPipeId = 'reparticle';
  private pipe: ParticlePipe | null = null;
  private readonly selections = new Map<string, ParticleRendering>();
  private readonly defaultTints = new Map<string, ParticleTint>();
  private readonly simulations = new Map<string, Emitter>();
  private disposed = false;
  private readonly states = new Map<string, EmitterState>();

  public constructor(
    definition: unknown,
    options: ParticleRendering | ParticleViewOptions = { emitters: {} },
  ) {
    super({});
    const effect = parseEffectConfig(definition);
    const selections = this.selections;
    if ('emitters' in options) {
      const ids = new Set(effect.emitters.map((emitter) => emitter.id));
      for (const [id, texture] of Object.entries(options.emitters)) {
        if (!ids.has(id)) {
          throw new Error(`Unknown particle emitter: ${id}`);
        }
        selections.set(id, texture);
      }
    } else {
      if (effect.emitters.length !== 1) {
        throw new Error('Select textures by emitter ID for a multi-emitter effect');
      }
      selections.set(effect.emitters[0].id, options);
    }
    // Validate every selection before allocating any emitter resources.
    for (const texture of selections.values()) {
      resolveTint(texture.tint);
      resolvePivot(texture.pivot);
      resolveTextureFlip(texture);
      if (!resolveFlipbook(texture)) {
        resolveTexture(texture);
      }
    }
    for (const config of effect.emitters) {
      const emitter = new Emitter(null, config, effect.modifiers, this.effectTransform);
      const rendering = selections.get(emitter.id) ?? { texture: null };
      const tint = resolveTint(rendering.tint);
      selections.set(emitter.id, { ...rendering, tint });
      this.defaultTints.set(emitter.id, tint);
      this.simulations.set(emitter.id, emitter);
      this.states.set(emitter.id, emitter.state);
      emitter.onStateChange((event) => {
        this.pipe?.restoreState();
        this.states.set(event.emitterId, event.state);
        const change = { ...event, awakeEmitters: this.awakeEmitters };
        this.emit('statechange', change);
      });
    }
  }

  /** @internal Called before Pixi changes the rendered root's transform. */
  public prepare(pipe: ParticlePipe): void {
    if (this.pipe && this.pipe !== pipe) {
      throw new Error('ParticleView cannot move between renderers');
    }
    this.syncSceneTransform();
    this.pipe = pipe;
  }

  /** @internal Rendering configuration is independent of core simulation. */
  public getRendering(id: string): ParticleRendering {
    this.getEmitter(id);
    return this.selections.get(id)!;
  }

  public get awakeEmitters(): number {
    let count = 0;
    for (const state of this.states.values()) {
      if (state !== 'sleeping') {
        count++;
      }
    }
    return count;
  }

  public get isSleeping(): boolean {
    return this.awakeEmitters === 0;
  }

  public play(): void {
    for (const emitter of this.simulations.values()) {
      const view = this.pipe?.getEmitterView(this, emitter.id);
      if (view) {
        view.play();
      } else {
        emitter.play();
      }
    }
  }

  public retire(): void {
    for (const emitter of this.simulations.values()) {
      emitter.retire();
    }
  }

  public stop(options: StopOptions = {}): void {
    for (const emitter of this.simulations.values()) {
      const view = this.pipe?.getEmitterView(this, emitter.id);
      if (view) {
        view.stop(options);
      } else {
        emitter.stop(options);
      }
    }
  }

  public clear(): void {
    this.stop({ clear: true });
  }

  /** Read-only lookup; use getEmitter to require a known ID. */
  public get emitters(): ReadonlyMap<string, Emitter> {
    return this.simulations;
  }

  public getEmitter(id: string): Emitter {
    const emitter = this.simulations.get(id);
    if (!emitter) {
      throw new Error(`Unknown particle emitter: ${id}`);
    }
    return emitter;
  }

  public setEmitterTint(id: string, tint: ParticleTint): void {
    const rendering = this.getRendering(id);
    const value = resolveTint(tint);
    this.pipe?.getEmitterView(this, id)?.setTint(value);
    this.selections.set(id, { ...rendering, tint: value });
  }

  public getEmitterTint(id: string): ParticleTint {
    return { ...this.getRendering(id).tint! };
  }

  /** Remove the override and restore the authored rendering tint. */
  public resetEmitterTint(id: string): void {
    this.getEmitter(id);
    this.setEmitterTint(id, this.defaultTints.get(id)!);
  }

  public setEmitterTexture(id: string, options: ParticleTexture): void {
    const rendering = this.getRendering(id);
    resolvePivot(options.pivot);
    resolveTextureFlip(options);
    if (!resolveFlipbook(options)) {
      resolveTexture(options);
    }
    this.pipe?.getEmitterView(this, id)?.setTexture(options);
    this.selections.set(id, { ...options, tint: resolveTint(rendering.tint) });
  }

  public getEmitterTexture(id: string): Texture | null {
    const rendering = this.getRendering(id);
    return resolveFlipbook(rendering)?.frames[0] ?? resolveTexture(rendering);
  }

  /** Single-emitter convenience; multi-emitter callers must select by ID. */
  public get emitter(): Emitter {
    return this.getEmitter(this.singleEmitterId);
  }

  public get texture(): Texture | null {
    return this.getEmitterTexture(this.singleEmitterId);
  }

  public set texture(texture: Texture | null) {
    this.setTexture({ texture });
  }

  public setTexture(options: ParticleTexture): void {
    this.setEmitterTexture(this.singleEmitterId, options);
  }

  /** Advance initialized simulations. Playback waits for the first render. */
  public update(seconds: number): void {
    this.syncSceneTransform();
    for (const emitter of this.simulations.values()) {
      const view = this.pipe?.getEmitterView(this, emitter.id);
      if (view) {
        view.update(seconds);
      } else {
        emitter.update(seconds);
      }
    }
  }

  public reset(): void {
    for (const emitter of this.simulations.values()) {
      const view = this.pipe?.getEmitterView(this, emitter.id);
      if (view) {
        view.reset();
      } else {
        emitter.reset();
      }
    }
  }

  /** @internal Invoked by the particle pipe inside Pixi's draw instruction sequence. */
  public draw(views: ReadonlyMap<string, EmitterView>): void {
    // Particle positions already include the scene transform. Convert back to the
    // view's local coordinates, then use Pixi's current group and target transform.
    if (
      this.sceneTransform.a * this.sceneTransform.d -
        this.sceneTransform.b * this.sceneTransform.c ===
      0
    ) {
      return;
    }
    this.drawTransform.copyFrom(this.sceneTransform).invert();
    // A view rendered as its own group has no transform relative to that group.
    // Pixi may still retain its previous relative transform from a parent draw.
    if (!this.renderGroup) {
      this.drawTransform.prepend(this.relativeGroupTransform);
    }
    // A render-group root already contributes its tint and alpha through global uniforms.
    const relativeColor = this.renderGroup ? 0xffffffff : this.groupColorAlpha;
    for (const view of views.values()) {
      view.renderParticles(this.drawTransform, relativeColor);
    }
  }

  public override destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.pipe?.destroyRenderable(this);
    for (const emitter of this.simulations.values()) {
      emitter.destroy();
    }
    this.pipe?.restoreState();
    this.pipe = null;
    this.states.clear();
    this.selections.clear();
    this.defaultTints.clear();
    this.simulations.clear();
    super.destroy();
  }

  /** Read the current hierarchy before simulation, even before Pixi's render traversal. */
  private syncSceneTransform(): void {
    const matrix = this.getGlobalTransform(this.sceneTransform);
    const scale = Math.hypot(matrix.a, matrix.b);
    // Decompose as rotation × uniform scale × optional local-X reflection.
    const handedness = matrix.a * matrix.d - matrix.b * matrix.c < 0 ? -1 : 1;
    const tolerance = 1e-6 * Math.max(1, scale);
    if (
      Math.abs(matrix.c + matrix.b * handedness) > tolerance ||
      Math.abs(matrix.d - matrix.a * handedness) > tolerance
    ) {
      throw new Error(
        'ParticleView requires equal-magnitude scene scale on both axes without skew',
      );
    }
    this.effectTransform.set({
      x: matrix.tx,
      y: matrix.ty,
      rotation: (-Math.atan2(matrix.b * handedness, matrix.a * handedness) * 180) / Math.PI,
      scale,
      handedness,
    });
  }

  private get singleEmitterId(): string {
    if (this.simulations.size !== 1) {
      throw new Error('Select an emitter by ID for a multi-emitter effect');
    }
    return this.simulations.keys().next().value!;
  }
}
