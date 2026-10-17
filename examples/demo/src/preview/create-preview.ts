import { parseEffectConfig } from '@reparticle/core';
import { ParticleView } from '@reparticle/pixi';
import { Application, Assets, type Texture, type WebGLRenderer } from 'pixi.js';

import { createStats } from '../devtools';
import type { ParticlePreview, ParticleTextureName, PreviewControls } from '../types/preview';

/** Owns imperative GPU resources; React owns the surrounding UI. */
export async function createPreview(
  host: HTMLDivElement,
  signal: AbortSignal,
): Promise<ParticlePreview | null> {
  const app = new Application();
  let stats: ReturnType<typeof createStats> | undefined;
  let transferred = false;
  const cleanup = () => {
    try {
      stats?.destroy();
    } finally {
      if (app.renderer) {
        app.destroy(true, { children: true });
      } else {
        app.stage.destroy({ children: true });
      }
    }
  };
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
    const response = await fetch(`${import.meta.env.BASE_URL}effect.json`, { signal });
    if (!response.ok) {
      throw new Error(`Unable to load effect.json: ${response.status}`);
    }
    const effect = parseEffectConfig(await response.json());
    if (signal.aborted) {
      return null;
    }
    const textures = await Assets.load<Texture>([
      '/textures/star.svg',
      '/textures/leaf.svg',
      '/textures/spark.svg',
    ]);
    if (signal.aborted) {
      return null;
    }
    const choices: Record<ParticleTextureName, Texture | null> = {
      star: textures['/textures/star.svg']!,
      leaf: textures['/textures/leaf.svg']!,
      spark: textures['/textures/spark.svg']!,
      procedural: null,
    };
    const renderer = app.renderer as WebGLRenderer;
    const emitterDefinition = effect.emitters[0];
    let controls: PreviewControls = {
      capacity: emitterDefinition.capacity,
      rate: emitterDefinition.emission.rate,
      gravity: emitterDefinition.modifiers.gravity.y,
      lifetime: emitterDefinition.initial.lifetime,
      texture: 'star',
      size: 24,
      paused: false,
      statsVisible: true,
    };
    let view = new ParticleView(renderer, effect);
    app.stage.addChild(view);
    view.texture = choices[controls.texture];
    view.particleSize = controls.size;
    view.emitter.x = host.clientWidth / 2;
    view.emitter.y = host.clientHeight * 0.7;
    stats = createStats({
      container: host,
      display: 'compact',
      gl: renderer.gl,
      subscribePostRender(listener) {
        const callback = () => listener(app.ticker.lastTime);
        app.ticker.add(callback, undefined, -100);
        return () => app.ticker.remove(callback);
      },
    });
    const overlay = stats;
    app.ticker.add((ticker) => {
      if (!controls.paused) {
        view.update(Math.min(ticker.deltaMS / 1000, 0.05));
      }
    });
    host.appendChild(app.canvas);
    let destroyed = false;
    const preview: ParticlePreview = {
      get controls() {
        return { ...controls };
      },
      update(patch) {
        const next = { ...controls, ...patch };
        const parameters = {
          emission: { rate: next.rate },
          initial: { lifetime: next.lifetime },
          modifiers: { gravity: { y: next.gravity } },
        };
        if (next.capacity !== controls.capacity) {
          overlay.hide();
          try {
            const current = view.emitter.configuration;
            const replacement = new ParticleView(renderer, {
              version: 1,
              emitters: [
                {
                  ...current,
                  capacity: next.capacity,
                  emission: { ...current.emission, ...parameters.emission },
                  initial: { ...current.initial, ...parameters.initial },
                  modifiers: {
                    gravity: { ...current.modifiers.gravity, ...parameters.modifiers.gravity },
                  },
                },
              ],
            });
            replacement.texture = choices[next.texture];
            replacement.particleSize = next.size;
            replacement.emitter.x = view.emitter.x;
            replacement.emitter.y = view.emitter.y;
            replacement.emitter.emitting = view.emitter.emitting;
            app.stage.addChildAt(replacement, app.stage.getChildIndex(view));
            app.stage.removeChild(view);
            view.destroy();
            view = replacement;
          } finally {
            if (controls.statsVisible) {
              overlay.show();
            }
          }
        } else if (
          next.rate !== controls.rate ||
          next.gravity !== controls.gravity ||
          next.lifetime !== controls.lifetime
        ) {
          view.emitter.setParameters(parameters);
        }
        view.texture = choices[next.texture];
        view.particleSize = next.size;
        if (next.statsVisible) {
          overlay.show();
        } else {
          overlay.hide();
        }
        controls = next;
        return { ...controls };
      },
      movePointer(clientX, clientY) {
        const rect = host.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }
        view.emitter.x = ((clientX - rect.left) * app.screen.width) / rect.width;
        view.emitter.y = ((clientY - rect.top) * app.screen.height) / rect.height;
      },
      reset() {
        view.reset();
      },
      destroy() {
        if (destroyed) {
          return;
        }
        destroyed = true;
        cleanup();
      },
    };
    transferred = true;
    return preview;
  } finally {
    if (!transferred) {
      cleanup();
    }
  }
}
