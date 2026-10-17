import { Application, type WebGLRenderer } from 'pixi.js';

import { createPreviewStats } from '../devtools/create-preview-stats';
import type { ParticlePreview, PreviewControls } from '../types/preview';
import { runCleanup } from '../utils/run-cleanup';
import { destroyApplication } from './destroy-application';
import { loadPreviewAssets } from './load-preview-assets';
import { PreviewScene } from './preview-scene';

/** Connects the scene, ticker, and debug overlay to a mounted canvas host. */
export async function createPreview(
  host: HTMLDivElement,
  signal: AbortSignal,
): Promise<ParticlePreview | null> {
  const app = new Application<WebGLRenderer>();
  let scene: PreviewScene | undefined;
  let stats: ReturnType<typeof createPreviewStats> | undefined;
  let mounted = false;
  let destroyed = false;

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    runCleanup([() => stats?.destroy(), () => scene?.destroy(), () => destroyApplication(app)]);
  }

  try {
    await app.init({
      resizeTo: host,
      background: '#0a111c',
      antialias: false,
      preference: 'webgl',
      preferWebGLVersion: 2,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    if (signal.aborted) {
      return null;
    }

    const assets = await loadPreviewAssets(signal);

    if (!assets) {
      return null;
    }

    const activeScene = new PreviewScene(app, host, assets);
    scene = activeScene;
    const debug = createPreviewStats(app, host, activeScene.controls.capacity);
    stats = debug;

    function advance(elapsedSeconds: number) {
      const controls = activeScene.controls;
      if (controls.paused) {
        return;
      }
      const emitting = activeScene.emitting;
      activeScene.advance(elapsedSeconds);
      debug.advance(elapsedSeconds, controls, emitting);
    }

    app.ticker.add(({ deltaMS }) => advance(deltaMS / 1000));
    host.appendChild(app.canvas);
    mounted = true;

    function setControls(patch: Partial<PreviewControls>): PreviewControls {
      const current = activeScene.controls;
      const capacityChanged = patch.capacity !== undefined && patch.capacity !== current.capacity;
      const shapeChanged = patch.shape !== undefined && patch.shape !== current.shape;
      const durationChanged = patch.duration !== undefined && patch.duration !== current.duration;
      const durationSpreadChanged =
        patch.durationSpread !== undefined && patch.durationSpread !== current.durationSpread;
      const delaySpreadChanged =
        patch.startDelaySpread !== undefined && patch.startDelaySpread !== current.startDelaySpread;
      const rateSpreadChanged =
        patch.rateSpread !== undefined && patch.rateSpread !== current.rateSpread;
      const diameterCurveChanged =
        (patch.diameterCurve !== undefined && patch.diameterCurve !== current.diameterCurve) ||
        (current.diameterCurve !== 'constant' &&
          patch.diameter !== undefined &&
          patch.diameter !== current.diameter);
      const widthCurveChanged =
        (patch.widthCurve !== undefined && patch.widthCurve !== current.widthCurve) ||
        (current.widthCurve !== 'constant' &&
          patch.width !== undefined &&
          patch.width !== current.width);
      const heightCurveChanged =
        (patch.heightCurve !== undefined && patch.heightCurve !== current.heightCurve) ||
        (current.heightCurve !== 'constant' &&
          patch.height !== undefined &&
          patch.height !== current.height);
      const vortexChanged =
        (patch.vortexCurve !== undefined && patch.vortexCurve !== current.vortexCurve) ||
        (current.vortexCurve !== 'constant' &&
          patch.vortex !== undefined &&
          patch.vortex !== current.vortex);
      const radialChanged =
        (patch.radialCurve !== undefined && patch.radialCurve !== current.radialCurve) ||
        (current.radialCurve !== 'constant' &&
          patch.radial !== undefined &&
          patch.radial !== current.radial);
      const accelerationChanged =
        (patch.accelerationCurve !== undefined &&
          patch.accelerationCurve !== current.accelerationCurve) ||
        (current.accelerationCurve !== 'constant' &&
          patch.acceleration !== undefined &&
          patch.acceleration !== current.acceleration);
      const dragChanged =
        (patch.dragCurve !== undefined && patch.dragCurve !== current.dragCurve) ||
        (current.dragCurve !== 'constant' &&
          patch.drag !== undefined &&
          patch.drag !== current.drag);
      const spaceChanged = patch.space !== undefined && patch.space !== current.space;
      const modeChanged = patch.playMode !== undefined && patch.playMode !== current.playMode;
      const delayChanged =
        patch.startDelay !== undefined && patch.startDelay !== current.startDelay;
      const offsetChanged =
        patch.startOffset !== undefined && patch.startOffset !== current.startOffset;
      const curveChanged = patch.sizeCurve !== undefined && patch.sizeCurve !== current.sizeCurve;
      const alphaCurveChanged =
        patch.alphaCurve !== undefined && patch.alphaCurve !== current.alphaCurve;
      const colorCurveChanged =
        patch.colorCurve !== undefined && patch.colorCurve !== current.colorCurve;
      const rotationCurveChanged =
        patch.rotationCurve !== undefined && patch.rotationCurve !== current.rotationCurve;
      const orientationChanged =
        patch.orientation !== undefined && patch.orientation !== current.orientation;
      const rateCurveChanged =
        patch.rateCurve !== undefined && patch.rateCurve !== current.rateCurve;
      const curveRateChanged =
        current.rateCurve !== 'constant' && patch.rate !== undefined && patch.rate !== current.rate;
      const speedCurveChanged =
        patch.speedCurve !== undefined && patch.speedCurve !== current.speedCurve;
      const curveSpeedChanged =
        current.speedCurve !== 'constant' &&
        patch.speed !== undefined &&
        patch.speed !== current.speed;
      const initialSizeCurveChanged =
        patch.initialSizeCurve !== undefined && patch.initialSizeCurve !== current.initialSizeCurve;
      const curveSizeChanged =
        current.initialSizeCurve !== 'constant' &&
        patch.size !== undefined &&
        patch.size !== current.size;
      const initialRotationCurveChanged =
        patch.initialRotationCurve !== undefined &&
        patch.initialRotationCurve !== current.initialRotationCurve;
      const curveRotationChanged =
        current.initialRotationCurve !== 'constant' &&
        patch.rotation !== undefined &&
        patch.rotation !== current.rotation;
      const initialRedCurveChanged =
        patch.initialRedCurve !== undefined && patch.initialRedCurve !== current.initialRedCurve;
      const curveRedChanged =
        current.initialRedCurve !== 'constant' &&
        patch.red !== undefined &&
        patch.red !== current.red;
      const initialGreenCurveChanged =
        patch.initialGreenCurve !== undefined &&
        patch.initialGreenCurve !== current.initialGreenCurve;
      const curveGreenChanged =
        current.initialGreenCurve !== 'constant' &&
        patch.green !== undefined &&
        patch.green !== current.green;
      const initialBlueCurveChanged =
        patch.initialBlueCurve !== undefined && patch.initialBlueCurve !== current.initialBlueCurve;
      const curveBlueChanged =
        current.initialBlueCurve !== 'constant' &&
        patch.blue !== undefined &&
        patch.blue !== current.blue;
      const initialAlphaCurveChanged =
        patch.initialAlphaCurve !== undefined &&
        patch.initialAlphaCurve !== current.initialAlphaCurve;
      const curveAlphaChanged =
        current.initialAlphaCurve !== 'constant' &&
        patch.alpha !== undefined &&
        patch.alpha !== current.alpha;
      const initialLifetimeCurveChanged =
        patch.initialLifetimeCurve !== undefined &&
        patch.initialLifetimeCurve !== current.initialLifetimeCurve;
      const curveLifetimeChanged =
        current.initialLifetimeCurve !== 'constant' &&
        patch.lifetime !== undefined &&
        patch.lifetime !== current.lifetime;
      const rebuilding =
        initialLifetimeCurveChanged ||
        curveLifetimeChanged ||
        initialAlphaCurveChanged ||
        curveAlphaChanged ||
        initialBlueCurveChanged ||
        curveBlueChanged ||
        initialGreenCurveChanged ||
        curveGreenChanged ||
        initialRedCurveChanged ||
        curveRedChanged ||
        initialRotationCurveChanged ||
        curveRotationChanged ||
        initialSizeCurveChanged ||
        curveSizeChanged ||
        speedCurveChanged ||
        curveSpeedChanged ||
        rateCurveChanged ||
        curveRateChanged ||
        orientationChanged ||
        capacityChanged ||
        shapeChanged ||
        diameterCurveChanged ||
        widthCurveChanged ||
        heightCurveChanged ||
        vortexChanged ||
        radialChanged ||
        accelerationChanged ||
        dragChanged ||
        spaceChanged ||
        rateSpreadChanged ||
        durationChanged ||
        durationSpreadChanged ||
        delaySpreadChanged ||
        modeChanged ||
        delayChanged ||
        offsetChanged ||
        curveChanged ||
        alphaCurveChanged ||
        colorCurveChanged ||
        rotationCurveChanged;
      if (rebuilding) {
        debug.setVisible(false);
      }
      try {
        const controls = activeScene.setControls(patch);
        if (rebuilding) {
          debug.reset(controls.capacity);
        }
        return controls;
      } finally {
        debug.setVisible(activeScene.controls.statsVisible);
      }
    }

    function reset() {
      activeScene.reset();
      debug.reset(activeScene.controls.capacity);
    }

    return {
      get controls() {
        return { ...activeScene.controls };
      },
      setControls,
      movePointer: (x, y) => activeScene.movePointer(x, y),
      reset,
      destroy,
    };
  } finally {
    if (!mounted) {
      destroy();
    }
  }
}
