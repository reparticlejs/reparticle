import {
  parseEffectConfig,
  type Emitter,
  type EmitterState,
  type StopOptions,
} from '@reparticle/core';
import { RenderContainer, type Texture, type WebGLRenderer } from 'pixi.js';

import { EmitterView } from './emitter-view';
import { resolveFlipbook } from './resolve-flipbook';
import { resolveTexture } from './resolve-texture';
import type { ParticleStateListener } from './types/particle-state-change';
import type { ParticleTexture } from './types/particle-texture';
import type { ParticleViewOptions } from './types/particle-view-options';

export type { ParticleTexture, AnimationPlayback } from './types/particle-texture';
export type { ParticleStateChange, ParticleStateListener } from './types/particle-state-change';
export type { ParticleViewOptions } from './types/particle-view-options';

/** An effect display object. Bounds and hit areas remain opt-in; textures belong to the caller. */
export class ParticleView extends RenderContainer {
  private readonly views = new Map<string, EmitterView>();
  private readonly simulations = new Map<string, Emitter>();
  private disposed = false;
  private readonly states = new Map<string, EmitterState>();
  private readonly stateListeners = new Set<ParticleStateListener>();

  constructor(
    renderer: WebGLRenderer,
    definition: unknown,
    options: ParticleTexture | ParticleViewOptions = { emitters: {} },
  ) {
    super({});
    const effect = parseEffectConfig(definition);
    const selections = new Map<string, ParticleTexture>();
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
        );
        this.views.set(emitter.id, view);
        this.simulations.set(emitter.id, view.emitter);
        this.states.set(emitter.id, view.emitter.state);
        view.emitter.onStateChange((event) => {
          renderer.resetState();
          this.states.set(event.emitterId, event.state);
          const change = { ...event, awakeEmitters: this.awakeEmitters };
          for (const listener of [...this.stateListeners]) {
            listener(change);
          }
        });
      }
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
    for (const view of this.views.values()) {
      view.renderParticles(this.worldTransform, this.groupAlpha);
    }
  }

  override destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const view of this.views.values()) {
      view.destroy();
    }
    this.stateListeners.clear();
    this.states.clear();
    this.views.clear();
    this.simulations.clear();
    super.destroy();
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
