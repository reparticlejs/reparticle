import type { ParticleView } from '@reparticle/pixi';
import type { Application } from 'pixi.js';

import type { PreviewControls } from '../types/preview';
import type { PreviewAssets } from '../types/preview-scene';
import { createParticleView, replaceParticleView } from './particle-view';

export class PreviewScene {
  private view: ParticleView;
  private settings: PreviewControls;
  private destroyed = false;

  constructor(
    private readonly app: Application,
    private readonly host: HTMLDivElement,
    private readonly assets: PreviewAssets,
  ) {
    const definition = assets.effect.emitters[0];
    this.settings = {
      capacity: definition.capacity,
      rate: definition.emission.rate,
      gravity: definition.modifiers.gravity.y,
      lifetime: definition.initial.lifetime,
      texture: 'star',
      size: 24,
      paused: false,
      statsVisible: true,
    };
    this.view = createParticleView(app, definition, assets.textures, this.settings);
    try {
      this.view.emitter.x = host.clientWidth / 2;
      this.view.emitter.y = host.clientHeight * 0.7;
      app.stage.addChild(this.view);
    } catch (error) {
      this.view.destroy();
      throw error;
    }
  }

  get controls(): Readonly<PreviewControls> {
    return this.settings;
  }

  get emitting(): boolean {
    return this.view.emitter.emitting;
  }

  setControls(patch: Partial<PreviewControls>): PreviewControls {
    const next = { ...this.settings, ...patch };
    if (next.capacity !== this.settings.capacity) {
      this.view = replaceParticleView(this.app, this.view, this.assets.textures, next);
    } else {
      this.updateParameters(next);
      this.view.texture = this.assets.textures[next.texture];
      this.view.particleSize = next.size;
    }
    this.settings = next;
    return { ...next };
  }

  advance(seconds: number): void {
    this.view.update(seconds);
  }

  movePointer(clientX: number, clientY: number): void {
    const bounds = this.host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return;
    }
    this.view.emitter.x = ((clientX - bounds.left) * this.app.screen.width) / bounds.width;
    this.view.emitter.y = ((clientY - bounds.top) * this.app.screen.height) / bounds.height;
  }

  reset(): void {
    this.view.reset();
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.app.stage.removeChild(this.view);
    this.view.destroy();
  }

  private updateParameters(next: PreviewControls): void {
    const current = this.settings;
    if (
      next.rate === current.rate &&
      next.gravity === current.gravity &&
      next.lifetime === current.lifetime
    ) {
      return;
    }
    this.view.emitter.setParameters({
      emission: { rate: next.rate },
      initial: { lifetime: next.lifetime },
      modifiers: { gravity: { y: next.gravity } },
    });
  }
}
