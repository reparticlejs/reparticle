import type { ParticleView } from '@reparticle/pixi';
import type { Application, WebGLRenderer } from 'pixi.js';

import type { PreviewControls } from '../types/preview';
import type { PreviewAssets } from '../types/preview-scene';
import { initialControls, emitterParameters } from './apply-controls';
import { createParticleView, replaceParticleView } from './particle-view';

export class PreviewScene {
  private view: ParticleView;
  private settings: PreviewControls;
  private destroyed = false;

  public constructor(
    private readonly app: Application<WebGLRenderer>,
    private readonly host: HTMLDivElement,
    private readonly assets: PreviewAssets,
  ) {
    const definition = assets.effect.emitters[0];
    this.settings = initialControls(definition);
    this.view = createParticleView(
      app,
      definition,
      assets.textures,
      this.settings,
      assets.effect.modifiers,
    );
    try {
      this.view.emitter.x = app.screen.width / 2;
      this.view.emitter.y = app.screen.height * 0.7;
      app.stage.addChild(this.view);
    } catch (error) {
      this.view.destroy();
      throw error;
    }
  }

  public get controls(): Readonly<PreviewControls> {
    return this.settings;
  }

  public get emitting(): boolean {
    return this.view.emitter.emitting;
  }

  public setControls(patch: Partial<PreviewControls>): PreviewControls {
    const next = { ...this.settings, ...patch };
    if (
      next.initialRedCurve !== this.settings.initialRedCurve ||
      (next.initialRedCurve !== 'constant' && next.red !== this.settings.red) ||
      next.initialGreenCurve !== this.settings.initialGreenCurve ||
      (next.initialGreenCurve !== 'constant' && next.green !== this.settings.green) ||
      next.initialBlueCurve !== this.settings.initialBlueCurve ||
      (next.initialBlueCurve !== 'constant' && next.blue !== this.settings.blue) ||
      next.initialAlphaCurve !== this.settings.initialAlphaCurve ||
      (next.initialAlphaCurve !== 'constant' && next.alpha !== this.settings.alpha) ||
      next.angularVelocityCurve !== this.settings.angularVelocityCurve ||
      next.initialAngularVelocityCurve !== this.settings.initialAngularVelocityCurve ||
      (next.initialAngularVelocityCurve !== 'constant' &&
        next.angularVelocity !== this.settings.angularVelocity) ||
      next.stretchXCurve !== this.settings.stretchXCurve ||
      next.initialStretchXCurve !== this.settings.initialStretchXCurve ||
      (next.initialStretchXCurve !== 'constant' && next.stretchX !== this.settings.stretchX) ||
      next.stretchYCurve !== this.settings.stretchYCurve ||
      next.initialStretchYCurve !== this.settings.initialStretchYCurve ||
      (next.initialStretchYCurve !== 'constant' && next.stretchY !== this.settings.stretchY) ||
      next.initialRotationCurve !== this.settings.initialRotationCurve ||
      (next.initialRotationCurve !== 'constant' && next.rotation !== this.settings.rotation) ||
      next.initialLifetimeCurve !== this.settings.initialLifetimeCurve ||
      (next.initialLifetimeCurve !== 'constant' && next.lifetime !== this.settings.lifetime) ||
      next.initialSizeCurve !== this.settings.initialSizeCurve ||
      (next.initialSizeCurve !== 'constant' && next.size !== this.settings.size) ||
      next.speedCurve !== this.settings.speedCurve ||
      (next.speedCurve !== 'constant' && next.speed !== this.settings.speed) ||
      next.rateCurve !== this.settings.rateCurve ||
      (next.rateCurve !== 'constant' && next.rate !== this.settings.rate) ||
      next.orientation !== this.settings.orientation ||
      next.rotationCurve !== this.settings.rotationCurve ||
      next.colorCurve !== this.settings.colorCurve ||
      next.alphaCurve !== this.settings.alphaCurve ||
      next.sizeCurve !== this.settings.sizeCurve ||
      next.capacity !== this.settings.capacity ||
      next.shape !== this.settings.shape ||
      next.startOffset !== this.settings.startOffset ||
      next.startDelay !== this.settings.startDelay ||
      next.diameterCurve !== this.settings.diameterCurve ||
      (next.diameterCurve !== 'constant' && next.diameter !== this.settings.diameter) ||
      next.widthCurve !== this.settings.widthCurve ||
      (next.widthCurve !== 'constant' && next.width !== this.settings.width) ||
      next.heightCurve !== this.settings.heightCurve ||
      (next.heightCurve !== 'constant' && next.height !== this.settings.height) ||
      next.vortexCurve !== this.settings.vortexCurve ||
      (next.vortexCurve !== 'constant' && next.vortex !== this.settings.vortex) ||
      next.radialCurve !== this.settings.radialCurve ||
      (next.radialCurve !== 'constant' && next.radial !== this.settings.radial) ||
      next.accelerationCurve !== this.settings.accelerationCurve ||
      (next.accelerationCurve !== 'constant' && next.acceleration !== this.settings.acceleration) ||
      next.dragCurve !== this.settings.dragCurve ||
      (next.dragCurve !== 'constant' && next.drag !== this.settings.drag) ||
      next.space !== this.settings.space ||
      next.rateSpread !== this.settings.rateSpread ||
      next.duration !== this.settings.duration ||
      next.durationSpread !== this.settings.durationSpread ||
      next.startDelaySpread !== this.settings.startDelaySpread ||
      next.playMode !== this.settings.playMode
    ) {
      this.view = replaceParticleView(
        this.app,
        this.view,
        this.assets.textures,
        next,
        this.assets.effect.emitters[0],
        this.assets.effect.modifiers,
      );
    } else {
      this.updateParameters(next);
      if (next.texture !== this.settings.texture) {
        this.view.setTexture(this.assets.textures[next.texture]);
      }
    }
    this.settings = next;
    return { ...next };
  }

  public advance(seconds: number): void {
    this.view.update(seconds);
  }

  public movePointer(clientX: number, clientY: number): void {
    const bounds = this.host.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return;
    }
    const relativeX = (clientX - bounds.left) / bounds.width;
    const relativeY = (clientY - bounds.top) / bounds.height;
    this.view.emitter.x = relativeX * this.app.screen.width;
    this.view.emitter.y = relativeY * this.app.screen.height;
  }

  public reset(): void {
    this.view.reset();
  }

  public destroy(): void {
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
      next.red === current.red &&
      next.green === current.green &&
      next.blue === current.blue &&
      next.alpha === current.alpha &&
      next.angularVelocity === current.angularVelocity &&
      next.angularVelocitySpread === current.angularVelocitySpread &&
      next.blendMode === current.blendMode &&
      next.stretchWithVelocity === current.stretchWithVelocity &&
      next.stretchX === current.stretchX &&
      next.stretchY === current.stretchY &&
      next.stretchXSpread === current.stretchXSpread &&
      next.stretchYSpread === current.stretchYSpread &&
      next.rotation === current.rotation &&
      next.emitterRotation === current.emitterRotation &&
      next.emitterScale === current.emitterScale &&
      next.inheritVelocity === current.inheritVelocity &&
      next.diameterSpread === current.diameterSpread &&
      next.widthSpread === current.widthSpread &&
      next.heightSpread === current.heightSpread &&
      next.sizeSpread === current.sizeSpread &&
      next.redSpread === current.redSpread &&
      next.greenSpread === current.greenSpread &&
      next.blueSpread === current.blueSpread &&
      next.alphaSpread === current.alphaSpread &&
      next.rotationSpread === current.rotationSpread &&
      next.size === current.size &&
      next.rate === current.rate &&
      next.vortexRotation === current.vortexRotation &&
      next.vortex === current.vortex &&
      next.vortexSpread === current.vortexSpread &&
      next.vortexX === current.vortexX &&
      next.vortexY === current.vortexY &&
      next.vortexMaxDistance === current.vortexMaxDistance &&
      next.radial === current.radial &&
      next.radialSpread === current.radialSpread &&
      next.radialX === current.radialX &&
      next.radialY === current.radialY &&
      next.radialMaxDistance === current.radialMaxDistance &&
      next.acceleration === current.acceleration &&
      next.accelerationSpread === current.accelerationSpread &&
      next.accelerationRotation === current.accelerationRotation &&
      next.drag === current.drag &&
      next.dragSpread === current.dragSpread &&
      next.dragDirectional === current.dragDirectional &&
      next.dragRotation === current.dragRotation &&
      next.speed === current.speed &&
      next.speedSpread === current.speedSpread &&
      next.lifetimeSpread === current.lifetimeSpread &&
      next.lifetime === current.lifetime &&
      (next.shape !== 'circle' || next.diameter === current.diameter) &&
      ((next.shape !== 'box' && next.shape !== 'cone2d') ||
        (next.width === current.width && next.height === current.height))
    ) {
      return;
    }
    this.view.emitter.setParameters(
      emitterParameters(next, this.view.emitter.configuration.modifiers),
    );
  }
}
