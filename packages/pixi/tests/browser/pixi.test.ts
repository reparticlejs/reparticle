import { ParticleEffect, type EffectInput } from '@reparticle/pixi';
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
} from 'pixi.js';
import { expect, it } from 'vitest';

it('renders textures, masks and filters and preserves playback and resource ownership', async () => {
  const app = new Application<WebGLRenderer>();
  const cleanup: (() => void)[] = [];
  try {
    await app.init({
      width: 256,
      height: 256,
      preference: 'webgl',
      preferWebGLVersion: 2,
      antialias: false,
      autoStart: false,
      background: 0x000000,
    });
    document.body.appendChild(app.canvas);
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
    const mask = new Graphics().rect(0, 0, 128, 256).fill(0xffffff);
    app.stage.addChild(mask);
    group.mask = mask;
    image = pixels();
    expect(red(image, 120, 128) > 200 && red(image, 136, 128) < 5, 'maskClips').toBe(true);
    group.filterArea = new Rectangle(0, 0, 256, 256);
    const filter = new AlphaFilter({ alpha: 0.5 });
    cleanup.push(() => filter.destroy());
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
    expect(app.renderer.gl.getError() === app.renderer.gl.NO_ERROR, 'noGlError').toBe(true);
    other.destroy();
  } finally {
    app.destroy(true, { children: true, texture: false, textureSource: false });
    for (const dispose of cleanup.reverse()) {
      dispose();
    }
  }
});
