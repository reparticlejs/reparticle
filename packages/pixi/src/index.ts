import {
  parseEffectConfig,
  EffectTransform,
  type Emitter,
  type EmitterState,
  type StopOptions,
} from '@reparticle/core';
import { Matrix, RenderContainer, type Texture, type WebGLRenderer } from 'pixi.js';

import { EmitterView } from './emitter-view';
import { resolveFlipbook } from './resolve-flipbook';
import { resolvePivot } from './resolve-pivot';
import { resolveTexture } from './resolve-texture';
import { resolveTint } from './resolve-tint';
import { restoreSimulationState } from './restore-simulation-state';
import type { ParticleRendering, ParticleTint } from './types/particle-rendering';
import type { ParticleStateListener } from './types/particle-state-change';
import type { ParticleTexture } from './types/particle-texture';
import type { ParticleViewOptions } from './types/particle-view-options';

export type {
  ParticleTexture,
  AnimationPlayback,
  ParticleSizeMode,
  ParticlePivot,
} from './types/particle-texture';
export type { ParticleStateChange, ParticleStateListener } from './types/particle-state-change';
export type { ParticleRendering, ParticleTint } from './types/particle-rendering';
export type { ParticleViewOptions } from './types/particle-view-options';

/** An effect display object. Bounds and hit areas remain opt-in; textures belong to the caller. */
export class ParticleView extends RenderContainer {
  private readonly effectTransform = new EffectTransform();
  private readonly sceneTransform = new Matrix();
  private readonly drawTransform = new Matrix();
  private readonly renderer: WebGLRenderer;
  private readonly views = new Map<string, EmitterView>();
  private readonly simulations = new Map<string, Emitter>();
  private disposed = false;
  private readonly states = new Map<string, EmitterState>();
  private readonly stateListeners = new Set<ParticleStateListener>();

  constructor(
    renderer: WebGLRenderer,
    definition: unknown,
    options: ParticleRendering | ParticleViewOptions = { emitters: {} },
  ) {
    super({});
    this.renderer = renderer;
    const effect = parseEffectConfig(definition);
    const selections = new Map<string, ParticleRendering>();
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
      if (!resolveFlipbook(texture)) {
        resolveTexture(texture);
      }
    }
    try {
      for (const emitter of effect.emitters) {
        const view = new EmitterView(
          renderer,
          emitter,
          selections.get(emitter.id),
          effect.modifiers,
          this.effectTransform,
        );
        this.views.set(emitter.id, view);
        this.simulations.set(emitter.id, view.emitter);
        this.states.set(emitter.id, view.emitter.state);
        view.emitter.onStateChange((event) => {
          restoreSimulationState(renderer);
          this.states.set(event.emitterId, event.state);
          const change = { ...event, awakeEmitters: this.awakeEmitters };
          for (const listener of [...this.stateListeners]) {
            listener(change);
          }
        });
      }
      renderer.runners.prerender.add(this);
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  get awakeEmitters(): number {
    let count = 0;
    for (const state of this.states.values()) {
      if (state !== 'sleeping') {
        count++;
      }
    }
    return count;
  }

  get isSleeping(): boolean {
    return this.awakeEmitters === 0;
  }

  onStateChange(listener: ParticleStateListener): () => void {
    if (this.disposed) {
      throw new Error('ParticleView has been destroyed');
    }
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  play(): void {
    for (const view of this.views.values()) {
      view.play();
    }
  }

  retire(): void {
    for (const emitter of this.simulations.values()) {
      emitter.retire();
    }
  }

  stop(options: StopOptions = {}): void {
    for (const view of this.views.values()) {
      view.stop(options);
    }
  }

  clear(): void {
    this.stop({ clear: true });
  }

  /** Read-only lookup; use getEmitter to require a known ID. */
  get emitters(): ReadonlyMap<string, Emitter> {
    return this.simulations;
  }

  getEmitter(id: string): Emitter {
    return this.getView(id).emitter;
  }

  setEmitterTint(id: string, tint: ParticleTint): void {
    this.getView(id).setTint(tint);
  }

  getEmitterTint(id: string): ParticleTint {
    return this.getView(id).getTint();
  }

  /** Remove the override and restore the authored rendering tint. */
  resetEmitterTint(id: string): void {
    this.getView(id).resetTint();
  }

  setEmitterTexture(id: string, options: ParticleTexture): void {
    this.getView(id).setTexture(options);
  }

  getEmitterTexture(id: string): Texture | null {
    return this.getView(id).texture;
  }

  /** Single-emitter convenience; multi-emitter callers must select by ID. */
  get emitter(): Emitter {
    return this.singleView.emitter;
  }

  get texture(): Texture | null {
    return this.singleView.texture;
  }

  set texture(texture: Texture | null) {
    this.singleView.texture = texture;
  }

  setTexture(options: ParticleTexture): void {
    this.singleView.setTexture(options);
  }

  update(seconds: number): void {
    this.syncSceneTransform();
    for (const view of this.views.values()) {
      view.update(seconds);
    }
  }

  reset(): void {
    for (const view of this.views.values()) {
      view.reset();
    }
  }

  override render(): void {
    // Particle positions already include the scene transform. Convert back to the
    // view's local coordinates, then use Pixi's current group and target transform.
    if (
      this.sceneTransform.a * this.sceneTransform.d -
        this.sceneTransform.b * this.sceneTransform.c ===
      0
    ) {
      return;
    }
    const globals = this.renderer.globalUniforms.globalUniformData;
    this.drawTransform
      .copyFrom(this.sceneTransform)
      .invert()
      .prepend(this.relativeGroupTransform)
      .prepend(globals.worldTransformMatrix)
      .translate(-globals.offset.x, -globals.offset.y)
      .prepend(globals.projectionMatrix);
    const opacity = this.groupAlpha * ((globals.worldColor >>> 24) / 255);
    for (const view of this.views.values()) {
      view.renderParticles(this.drawTransform, opacity);
    }
  }

  override destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.renderer.runners.prerender.remove(this);
    for (const view of this.views.values()) {
      view.destroy();
    }
    this.stateListeners.clear();
    this.states.clear();
    this.views.clear();
    this.simulations.clear();
    super.destroy();
  }

  /** Capture the scene before Pixi temporarily replaces the rendered root's transform. */
  private prerender(): void {
    this.syncSceneTransform();
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

  private getView(id: string): EmitterView {
    const view = this.views.get(id);
    if (!view) {
      throw new Error(`Unknown particle emitter: ${id}`);
    }
    return view;
  }

  private get singleView(): EmitterView {
    if (this.views.size !== 1) {
      throw new Error('Select an emitter by ID for a multi-emitter effect');
    }
    return this.views.values().next().value!;
  }
}
