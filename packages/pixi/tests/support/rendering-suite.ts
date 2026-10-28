import type { ParticleEffect as EffectClass, EffectInput } from '@reparticle/pixi';
import {
  Application,
  AlphaFilter,
  Container,
  Graphics,
  Rectangle,
  RenderTexture,
  Sprite,
  Texture,
  Ticker,
  type WebGLRenderer,
  type WebGPURenderer,
} from 'pixi.js';
import { expect, it, onTestFinished, vi } from 'vitest';

export function renderingSuite(
  ParticleEffect: typeof EffectClass,
  backends: readonly ('webgl' | 'webgpu')[],
) {
  it.each(backends)(
    'renders %s textures, masks and filters and preserves playback and resource ownership',
    async (backend) => {
      const app = new Application<WebGLRenderer | WebGPURenderer>();
      const cleanup: (() => void)[] = [];
      const warnings = vi.spyOn(console, 'warn');
      onTestFinished(() => warnings.mockRestore());
      let filter: AlphaFilter | undefined;
      try {
        console.info(`Pixi integration: initializing ${backend}`);
        await app.init({
          width: 256,
          height: 256,
          preference: backend,
          preferWebGLVersion: 2,
          antialias: false,
          autoStart: false,
          background: 0x000000,
        });
        // Pixi shares its sprite shader across renderers. Keep batch limits equal
        // so switching backends cannot reuse a shader with too many bindings.
        app.renderer.limits.maxBatchableTextures = 8;
        expect('gpu' in app.renderer ? 'webgpu' : 'webgl').toBe(backend);
        if ('gpu' in app.renderer) {
          app.renderer.gpu.device.pushErrorScope('validation');
        }
        document.body.appendChild(app.canvas);
        console.info('Pixi integration: rendering textures and checking playback');
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 16, 16);
        const artwork = Texture.from(canvas);
        cleanup.push(() => artwork.destroy(true));
        const definition: EffectInput = {
          version: 1,
          emitters: [
            {
              id: 'test',
              capacity: 64,
              seed: 42,
              emission: { rate: 60, shape: { type: 'point' } },
              initial: { lifetime: 2, speed: 0, direction: 0, spread: 0, size: 32 },
            },
          ],
        };
        const group = new Container();
        app.stage.addChild(group);
        const effect = new ParticleEffect(definition, {
          autoUpdate: false,
          emitters: { test: { textures: [artwork] } },
        });
        effect.position.set(128, 128);
        group.addChild(effect);
        const sentinel = new Sprite(Texture.WHITE);
        sentinel.tint = 0x00ff00;
        sentinel.position.set(8, 8);
        sentinel.width = 16;
        sentinel.height = 16;
        app.stage.addChild(sentinel);
        const background = new Graphics().rect(0, 0, 256, 256).fill(0x000000);
        app.stage.addChildAt(background, 0);
        app.render();
        effect.update(0.1);
        app.render();
        const pixels = () =>
          app.renderer.extract.pixels({ target: app.stage, frame: new Rectangle(0, 0, 256, 256) })
            .pixels;
        const red = (data: ArrayLike<number>, x: number, y: number) => data[(y * 256 + x) * 4]!;
        let image = pixels();
        expect(red(image, 128, 128) > 200, 'texturedParticle').toBe(true);
        expect(image[(12 * 256 + 12) * 4 + 1]! > 200, 'pixiStateRestored').toBe(true);
        const current = effect.emitter.texture;
        app.render();
        app.render();
        expect(effect.emitter.texture === current, 'renderDoesNotAdvance').toBe(true);
        effect.pause();
        effect.update(0.1);
        expect(effect.emitter.texture === current, 'pause').toBe(true);
        effect.resume();
        effect.update(0.1);
        expect(effect.emitter.texture !== current, 'resume').toBe(true);
        // Two frames from one atlas exercise float metadata uploads and GPU frame selection.
        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = 32;
        atlasCanvas.height = 16;
        const atlasContext = atlasCanvas.getContext('2d')!;
        atlasContext.fillStyle = '#ff0000';
        atlasContext.fillRect(0, 0, 16, 16);
        atlasContext.fillStyle = '#00ff00';
        atlasContext.fillRect(16, 0, 16, 16);
        const atlas = Texture.from(atlasCanvas);
        const firstFrame = new Texture({
          source: atlas.source,
          frame: new Rectangle(0, 0, 16, 16),
        });
        const secondFrame = new Texture({
          source: atlas.source,
          frame: new Rectangle(16, 0, 16, 16),
        });
        cleanup.push(() => {
          firstFrame.destroy();
          secondFrame.destroy();
          atlas.destroy(true);
        });
        effect.setEmitterTexture('test', {
          textures: [firstFrame, secondFrame],
          playback: 'loop-forward',
          fps: 10,
        });
        effect.reset();
        effect.update(0.1);
        image = pixels();
        expect(red(image, 128, 128), 'animation first frame').toBeGreaterThan(200);
        effect.stop();
        effect.update(0.1);
        image = pixels();
        expect(image[(128 * 256 + 128) * 4 + 1], 'animation second frame').toBeGreaterThan(200);
        expect(red(image, 128, 128), 'animation replaced first frame').toBeLessThan(5);
        effect.setEmitterTexture('test', { textures: [artwork] });
        effect.reset();
        effect.update(0.1);
        const mask = new Graphics().rect(0, 0, 128, 256).fill(0xffffff);
        console.info('Pixi integration: checking masks, filters, and render textures');
        app.stage.addChild(mask);
        group.mask = mask;
        image = pixels();
        expect(red(image, 120, 128) > 200 && red(image, 136, 128) < 5, 'maskClips').toBe(true);
        group.filterArea = new Rectangle(0, 0, 256, 256);
        filter = new AlphaFilter({ alpha: 0.5 });
        group.filters = [filter];
        image = pixels();
        expect(
          red(image, 120, 128) > 90 && red(image, 120, 128) < 170 && red(image, 136, 128) < 5,
          'maskAndFilter',
        ).toBe(true);
        group.mask = null;
        mask.destroy();
        group.filters = [];
        const target = RenderTexture.create({ width: 256, height: 256 });
        cleanup.push(() => target.destroy(true));
        app.renderer.render({ container: app.stage, target, clear: true });
        const offscreen = app.renderer.extract.pixels({ target }).pixels;
        expect(red(offscreen, 128, 128) > 200, 'renderTexture').toBe(true);
        // Alternate target rendering and updates to catch leaked framebuffer/uniform state.
        effect.update(0.1);
        app.render();
        image = pixels();
        expect(
          red(image, 128, 128) > 200 && image[(12 * 256 + 12) * 4 + 1]! > 200,
          'updateAfterOffscreen',
        ).toBe(true);
        const other = new ParticleEffect(definition, {
          autoUpdate: false,
          emitters: { test: { textures: [artwork] } },
        });
        console.info('Pixi integration: checking shared resources and ticker updates');
        other.position.set(192, 128);
        app.stage.addChild(other);
        app.render();
        other.update(0.1);
        effect.destroy();
        app.render();
        image = pixels();
        expect(
          red(image, 192, 128) > 200 && other.emitter.particleCount > 0,
          'sharedProgramSurvives',
        ).toBe(true);
        expect(!artwork.destroyed, 'borrowedTextureSurvives').toBe(true);
        const ticker = new Ticker();
        cleanup.push(() => ticker.destroy());
        other.ticker = ticker;
        other.autoUpdate = true;
        const before = other.emitter.texture;
        ticker.update(1000);
        ticker.update(1016.67);
        expect(
          other.emitter.texture !== before || other.emitter.particleCount > 6,
          'tickerUpdates',
        ).toBe(true);
        const steps: number[] = [];
        const update = other.update.bind(other);
        other.update = (seconds: number) => {
          steps.push(seconds);
          update(seconds);
        };
        ticker.update(1116.67);
        expect(
          steps.length === 6 && steps.every((step) => step <= 1 / 60 + 0.0001),
          'slowTickSubsteps',
        ).toBe(true);
        expect(
          Math.abs(steps.reduce((sum, step) => sum + step, 0) - 0.1) < 1e-6,
          'slowTickPreservesTime',
        ).toBe(true);
        steps.length = 0;
        ticker.update(1133.34);
        expect(steps.length === 1, 'normalTickSingleStep').toBe(true);
        other.update = update;
        other.autoUpdate = false;
        other.stop();
        for (let i = 0; i < 25; i++) {
          other.update(0.1);
        }
        expect(other.emitter.particleCount === 0, 'stopLetsParticlesExpire').toBe(true);
        other.reset();
        other.update(0.1);
        app.render();
        expect(other.emitter.particleCount > 0, 'resetRestarts').toBe(true);
        const glError = 'gl' in app.renderer ? app.renderer.gl.getError() : 0;
        expect(glError, 'noGlError').toBe(0);
        other.destroy();
        const gpuError =
          'gpu' in app.renderer ? await app.renderer.gpu.device.popErrorScope() : null;
        expect(gpuError?.message).toBeUndefined();
      } finally {
        console.info('Pixi integration: cleaning up');
        // Pixi retains this shared filter group after Filter.destroy(), including a
        // WebGPU uniform-batch resource. Detach it before destroying the owning app.
        filter?.groups[0]?.destroy();
        filter?.destroy();
        app.destroy(true, { children: true, texture: false, textureSource: false });
        for (const dispose of cleanup.reverse()) {
          dispose();
        }
      }
      expect(warnings).not.toHaveBeenCalled();
    },
  );
}
