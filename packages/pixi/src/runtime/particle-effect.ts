import {
  parseEffectConfig,
  EffectTransform,
  Emitter,
  type EmitterState,
  type EffectConfig,
  type EffectInput,
  type StopOptions,
} from '@reparticle/core';
import {
  Matrix,
  Ticker,
  UPDATE_PRIORITY,
  ViewContainer,
  type Bounds,
  type PointData,
  type Texture,
} from 'pixi.js';

import { resolveRendering } from '#config/resolve-rendering.js';
import type { ParticlePipe } from '#rendering/particle-pipe.js';
import { resolveTint } from '#rendering/resolve-tint.js';
import { resolveFlipbook } from '#textures/resolve-flipbook.js';
import { resolveTexture } from '#textures/resolve-texture.js';
import type { ParticleEffectOptions } from '#types/particle-effect-options.js';
import type {
  ParticleRendering,
  ResolvedParticleRendering,
  ParticleTint,
} from '#types/particle-rendering.js';
import type { ParticleTexture } from '#types/particle-texture.js';

import type { EmitterRenderer } from './emitter-renderer';

// Match prewarm's cadence so a slow frame cannot emit one widely spaced batch.
const TICK_STEP_SECONDS = 1 / 60;
// Accept rounded 60 Hz ticker values without doubling ordinary-frame GPU work.
const TICK_ROUNDING_SECONDS = 0.0001;

/**
 * An effect display object. Bounds and hit areas remain opt-in; textures belong to the caller.
 */
export class ParticleEffect extends ViewContainer {
  public override readonly renderPipeId = 'reparticle';
  public readonly batched = false;
  private readonly effectTransform = new EffectTransform();
  private readonly sceneTransform = new Matrix();
  private readonly drawTransform = new Matrix();
  private pipe: ParticlePipe | null = null;
  private currentTicker: Ticker;
  private automaticUpdates = false;
  private paused = false;
  private readonly tickListener: (ticker: Ticker) => void;
  private readonly renderingByEmitter = new Map<string, ResolvedParticleRendering>();
  private readonly defaultTints = new Map<string, ParticleTint>();
  private readonly simulations = new Map<string, Emitter>();
  private disposed = false;
  private readonly emitterStates = new Map<string, EmitterState>();

  public constructor(definition: EffectInput, options: ParticleEffectOptions = {}) {
    super({});
    const effect = parseEffectConfig(definition);
    this.configureRendering(effect, options.emitters);
    this.createEmitters(effect);
    this.tickListener = this.onTick.bind(this);
    this.currentTicker = options.ticker ?? Ticker.shared;
    this.autoUpdate = options.autoUpdate ?? true;
  }

  /** Disable automatic updates before driving update(seconds) yourself. */
  public get autoUpdate(): boolean {
    return this.automaticUpdates;
  }

  public set autoUpdate(enabled: boolean) {
    if (this.disposed || enabled === this.automaticUpdates) {
      return;
    }
    this.automaticUpdates = enabled;
    if (enabled) {
      // Normal updates run before Pixi's application render listener (LOW priority).
      this.currentTicker.add(this.tickListener, this, UPDATE_PRIORITY.NORMAL);
    } else {
      this.currentTicker.remove(this.tickListener, this);
    }
  }

  public get ticker(): Ticker {
    return this.currentTicker;
  }

  /** Transfer the listener without starting, stopping or destroying either ticker. */
  public set ticker(ticker: Ticker) {
    if (this.disposed || ticker === this.currentTicker) {
      return;
    }
    this.currentTicker.remove(this.tickListener, this);
    this.currentTicker = ticker;
    if (this.automaticUpdates) {
      ticker.add(this.tickListener, this, UPDATE_PRIORITY.NORMAL);
    }
  }

  /** Read-only lookup; use getEmitter to require a known ID. */
  public get emitters(): ReadonlyMap<string, Emitter> {
    return this.simulations;
  }

  /** Single-emitter convenience; multi-emitter callers must select by ID. */
  public get emitter(): Emitter {
    return this.getEmitter(this.singleEmitterId);
  }

  public get texture(): Texture | null {
    return this.getEmitterTexture(this.singleEmitterId);
  }

  public set texture(texture: Texture | null) {
    this.setTexture(texture ? { textures: [texture] } : {});
  }

  public get awakeEmitters(): number {
    let count = 0;
    for (const state of this.emitterStates.values()) {
      if (state !== 'sleeping') {
        count++;
      }
    }
    return count;
  }

  /** Whether simulation updates are paused, independently of the ticker setting. */
  public get isPaused(): boolean {
    return this.paused;
  }

  public get isSleeping(): boolean {
    return this.awakeEmitters === 0;
  }

  /** Override to supply local bounds; particle positions are never scanned or read back. */
  public addBounds(_bounds: Bounds): void {}

  /** Automatic particle hit testing is disabled; consumers can assign Pixi's hitArea. */
  public override containsPoint(_point: PointData): boolean {
    return false;
  }

  public play(): void {
    this.pipe?.assertAvailable();
    for (const emitter of this.simulations.values()) {
      this.playbackFor(emitter).play();
    }
  }

  /** Freeze particle movement, aging, and emission without changing autoUpdate. */
  public pause(): void {
    this.paused = true;
  }

  /** Continue from the paused state. Manual updates remain manual. */
  public resume(): void {
    this.paused = false;
  }

  /** Finish the current emission loop, then let remaining particles expire. */
  public retire(): void {
    for (const emitter of this.simulations.values()) {
      emitter.retire();
    }
  }

  public stop(options: StopOptions = {}): void {
    this.pipe?.assertAvailable();
    for (const emitter of this.simulations.values()) {
      this.playbackFor(emitter).stop(options);
    }
  }

  public clear(): void {
    this.stop({ clear: true });
  }

  /** Advance initialized simulations unless paused. Playback waits for the first render. */
  public update(seconds: number): void {
    if (this.paused) {
      return;
    }
    this.pipe?.assertAvailable();
    this.syncSceneTransform();
    for (const emitter of this.simulations.values()) {
      this.playbackFor(emitter).update(seconds);
    }
  }

  public reset(): void {
    this.pipe?.assertAvailable();
    for (const emitter of this.simulations.values()) {
      this.playbackFor(emitter).reset();
    }
  }

  public getEmitter(id: string): Emitter {
    const emitter = this.simulations.get(id);
    if (!emitter) {
      throw new Error(`Unknown particle emitter: ${id}`);
    }
    return emitter;
  }

  public setEmitterBlendMode(
    id: string,
    blendMode: NonNullable<ParticleRendering['blendMode']>,
  ): void {
    const rendering = resolveRendering({ ...this.getRendering(id), blendMode });
    this.pipe?.getEmitterRenderer(this, id)?.setBlendMode(rendering.blendMode);
    this.renderingByEmitter.set(id, rendering);
  }

  public setEmitterTint(id: string, tint: ParticleTint): void {
    const rendering = this.getRendering(id);
    const value = resolveTint(tint);
    this.pipe?.getEmitterRenderer(this, id)?.setTint(value);
    this.renderingByEmitter.set(id, { ...rendering, tint: value });
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
    this.pipe?.assertAvailable();
    const rendering = this.getRendering(id);
    const replacement = resolveRendering({
      ...options,
      tint: rendering.tint,
      blendMode: rendering.blendMode,
    });
    this.pipe?.getEmitterRenderer(this, id)?.setTexture(replacement);
    this.renderingByEmitter.set(id, replacement);
  }

  public getEmitterTexture(id: string): Texture | null {
    const rendering = this.getRendering(id);
    return resolveFlipbook(rendering)?.frames[0] ?? resolveTexture(rendering);
  }

  public setTexture(options: ParticleTexture): void {
    this.setEmitterTexture(this.singleEmitterId, options);
  }

  /** @internal Called before Pixi changes the rendered root's transform. */
  public prepare(pipe: ParticlePipe): void {
    if (this.pipe && this.pipe !== pipe) {
      throw new Error('ParticleEffect cannot move between renderers');
    }
    this.syncSceneTransform();
    this.pipe = pipe;
  }

  /** @internal Rendering configuration is independent of core simulation. */
  public getRendering(id: string): ResolvedParticleRendering {
    this.getEmitter(id);
    return this.renderingByEmitter.get(id)!;
  }

  /** @internal Invoked by the particle pipe inside Pixi's draw instruction sequence. */
  public draw(renderers: ReadonlyMap<string, EmitterRenderer>): void {
    // Particle positions already include the scene transform. Convert back to the
    // effect's local coordinates, then use Pixi's current group and target transform.
    const { a, b, c, d } = this.sceneTransform;
    const determinant = a * d - b * c;
    if (determinant === 0) {
      return;
    }
    this.drawTransform.copyFrom(this.sceneTransform).invert();
    // An effect rendered as its own group has no transform relative to that group.
    // Pixi may still retain its previous relative transform from a parent draw.
    if (!this.renderGroup) {
      this.drawTransform.prepend(this.relativeGroupTransform);
    }
    // A render-group root already contributes its tint and alpha through global uniforms.
    const relativeColor = this.renderGroup ? 0xffffffff : this.groupColorAlpha;
    for (const renderer of renderers.values()) {
      renderer.renderParticles(this.drawTransform, relativeColor);
    }
  }

  public override destroy(): void {
    if (this.disposed) {
      return;
    }
    this.pipe?.assertAvailable();
    this.autoUpdate = false;
    this.disposed = true;
    this.pipe?.destroyRenderable(this);
    for (const emitter of this.simulations.values()) {
      emitter.destroy();
    }
    this.pipe?.restoreState();
    this.pipe = null;
    this.emitterStates.clear();
    this.renderingByEmitter.clear();
    this.defaultTints.clear();
    this.simulations.clear();
    super.destroy();
  }

  /** Rebuild only explicitly supplied bounds, preserving the empty default. */
  protected override updateBounds(): void {
    this._bounds.clear();
    this.addBounds(this._bounds);
  }

  /** Preserve ticker time while keeping automatic birth batches close together. */
  private onTick(ticker: Ticker): void {
    const seconds = ticker.deltaMS / 1000;
    if (!Number.isFinite(seconds) || seconds <= TICK_STEP_SECONDS + TICK_ROUNDING_SECONDS) {
      this.update(seconds);
      return;
    }

    // Long startup frames otherwise move every new droplet by the whole delta,
    // leaving a gap after the prewarmed stream. Keep all time, using equal substeps.
    const stepCount = Math.ceil(seconds / (TICK_STEP_SECONDS + TICK_ROUNDING_SECONDS));
    const stepSeconds = seconds / stepCount;
    for (let step = 0; step < stepCount && !this.disposed; step++) {
      this.update(stepSeconds);
    }
  }

  /** Validate every artwork binding before creating simulations or subscribing to the ticker. */
  private configureRendering(
    effect: EffectConfig,
    artwork: ParticleEffectOptions['emitters'] = {},
  ): void {
    const emitterIds = new Set(effect.emitters.map((emitter) => emitter.id));
    for (const id of Object.keys(artwork)) {
      if (!emitterIds.has(id)) {
        throw new Error(`Unknown emitter artwork binding: ${id}`);
      }
    }

    for (const emitter of effect.emitters) {
      const rendering = resolveRendering({
        ...artwork[emitter.id],
        ...emitter.rendering,
      });
      this.renderingByEmitter.set(emitter.id, rendering);
    }
  }

  /** Core emitters share the effect transform and report lifecycle changes through Pixi. */
  private createEmitters(effect: EffectConfig): void {
    for (const config of effect.emitters) {
      const emitter = new Emitter(null, config, effect.modifiers, this.effectTransform);
      const rendering = this.renderingByEmitter.get(emitter.id)!;
      const tint = resolveTint(rendering.tint);
      this.renderingByEmitter.set(emitter.id, { ...rendering, tint });
      this.defaultTints.set(emitter.id, tint);
      this.simulations.set(emitter.id, emitter);
      this.emitterStates.set(emitter.id, emitter.state);
      emitter.onStateChange((event) => {
        this.emitterStates.set(event.emitterId, event.state);
        const change = { ...event, awakeEmitters: this.awakeEmitters };
        this.emit('statechange', change);
      });
    }
  }

  /** Before first render only core exists; afterward the renderer also tracks animation timing. */
  private playbackFor(emitter: Emitter): Emitter | EmitterRenderer {
    return this.pipe?.getEmitterRenderer(this, emitter.id) ?? emitter;
  }

  /** Read the current hierarchy before simulation, even before Pixi's render traversal. */
  private syncSceneTransform(): void {
    const matrix = this.getGlobalTransform(this.sceneTransform);
    const scale = Math.hypot(matrix.a, matrix.b);
    // Decompose as rotation × uniform scale × optional local-X reflection.
    const handedness = matrix.a * matrix.d - matrix.b * matrix.c < 0 ? -1 : 1;
    const tolerance = 1e-6 * Math.max(1, scale);
    const expectedC = -matrix.b * handedness;
    const expectedD = matrix.a * handedness;
    const uniformScale =
      Math.abs(matrix.c - expectedC) <= tolerance && Math.abs(matrix.d - expectedD) <= tolerance;
    if (!uniformScale) {
      throw new Error(
        'ParticleEffect requires equal-magnitude scene scale on both axes without skew',
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
