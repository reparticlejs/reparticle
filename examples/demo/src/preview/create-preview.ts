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
      const rebuilding =
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
        durationChanged ||
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
