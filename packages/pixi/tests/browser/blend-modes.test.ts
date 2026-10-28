import { ParticleEffect, type ParticleBlendMode } from '@reparticle/pixi';
import {
  Application,
  Container,
  GpuBlendModesToPixi,
  Graphics,
  Sprite,
  State,
  Texture,
} from 'pixi.js';
import { expect, it } from 'vitest';

const modes = [
  'normal',
  'add',
  'multiply',
  'screen',
] as const satisfies readonly ParticleBlendMode[];

/** Compare visible RGB after compositing, plus alpha before compositing. */
it.each(modes)(
  'matches %s on transparent backgrounds and preserves Pixi sprites',
  async (blendMode) => {
    const originalBlends = structuredClone(GpuBlendModesToPixi);
    const results: { alpha: number[]; composite: number[] }[] = [];
    for (const backend of ['webgl', 'webgpu'] as const) {
      const app = new Application();
      await app.init({
        preference: [backend],
        preferWebGLVersion: 2,
        width: 64,
        height: 64,
        backgroundAlpha: 0,
        autoStart: false,
        antialias: false,
        resolution: 1,
        preserveDrawingBuffer: true,
      });
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createLinearGradient(0, 0, 16, 16);
      gradient.addColorStop(0, 'rgba(255,100,40,0)');
      gradient.addColorStop(1, 'rgba(80,160,255,0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 16, 16);
      const artwork = Texture.from(canvas);
      const scene = new Container();
      const ordinary = new Sprite(Texture.WHITE);
      ordinary.tint = 0x60a0e0;
      ordinary.width = 48;
      ordinary.height = 48;
      ordinary.alpha = 0.6;
      ordinary.blendMode = blendMode;
      const capture = document.createElement('canvas');
      capture.width = 64;
      capture.height = 64;
      const context = capture.getContext('2d')!;
      const draw = async (container: Container) => {
        app.stage.removeChildren();
        app.stage.addChild(container);
        app.render();
        // Read the browser-composited canvas, not backend-specific extract buffers.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        context.clearRect(0, 0, 64, 64);
        context.drawImage(app.canvas, 0, 0);
        const alpha = Array.from(context.getImageData(0, 0, 64, 64).data).filter(
          (_v, i) => i % 4 === 3,
        );
        for (let y = 0; y < 64; y += 8) {
          for (let x = 0; x < 64; x += 8) {
            context.fillStyle = (x + y) % 16 === 0 ? '#181818' : '#808080';
            context.fillRect(x, y, 8, 8);
          }
        }
        context.drawImage(app.canvas, 0, 0);
        return { alpha, composite: Array.from(context.getImageData(0, 0, 64, 64).data) };
      };
      try {
        const ordinaryBefore = await draw(ordinary);
        // Exercise both soft circles and textured particles, over empty and partially
        // transparent destinations. Colored overlaps expose RGB blend mismatches too.
        for (const textured of [false, true]) {
          for (const destinationAlpha of [0, 0.4]) {
            const background = new Graphics()
              .rect(0, 0, 64, 64)
              .fill({ color: 0x5070a0, alpha: destinationAlpha });
            scene.addChild(background);
            for (const x of [28, 36]) {
              const effect = new ParticleEffect(
                {
                  version: 1,
                  emitters: [
                    {
                      id: 'test',
                      capacity: 4,
                      seed: 1,
                      emission: { rate: 10, shape: { type: 'point' } },
                      initial: {
                        lifetime: 2,
                        speed: 0,
                        direction: 0,
                        spread: 0,
                        size: 40,
                        alpha: 0.6,
                        red: 0.8,
                        green: 0.5,
                        blue: 0.3,
                      },
                      rendering: { blendMode },
                    },
                  ],
                },
                {
                  autoUpdate: false,
                  emitters: { test: { textures: textured ? [artwork] : undefined } },
                },
              );
              effect.position.set(x, 32);
              scene.addChild(effect);
            }
            // First render initializes the simulations, just as the public player does.
            await draw(scene);
            for (const child of scene.children) {
              if (child instanceof ParticleEffect) {
                child.update(0.1);
              }
            }
            results.push(await draw(scene));
            for (const child of scene.removeChildren()) {
              child.destroy();
            }
          }
        }
        expect(await draw(ordinary)).toEqual(ordinaryBefore);
        expect(GpuBlendModesToPixi).toEqual(originalBlends);
        const state = State.for2d();
        state.blendMode = blendMode;
        const ordinaryBlend =
          'gpu' in app.renderer
            ? app.renderer.state.getColorTargets(state, 1, 'rgba8unorm')[0]!.blend
            : originalBlends[blendMode];
        expect(ordinaryBlend).toEqual(originalBlends[blendMode]);
      } finally {
        ordinary.destroy();
        scene.destroy({ children: true });
        app.destroy(true, { children: true });
        artwork.destroy(true);
      }
    }
    for (let sample = 0; sample < 4; sample++) {
      const gl = results[sample]!;
      const gpu = results[sample + 4]!;
      expect(gl.alpha.some((alpha) => alpha > 0 && alpha < 255)).toBe(true);
      expect(gpu.alpha.some((alpha) => alpha > 0 && alpha < 255)).toBe(true);
      for (const channel of ['alpha', 'composite'] as const) {
        let max = 0;
        for (let i = 0; i < gl[channel].length; i++) {
          max = Math.max(max, Math.abs(gl[channel][i]! - gpu[channel][i]!));
        }
        expect(max, `${blendMode}, sample ${sample}, ${channel}`).toBeLessThanOrEqual(2);
      }
    }
  },
);
