import { ParticleEffect, validateAnimationFrames, type EffectInput } from '@reparticle/pixi';
import {
  Application,
  Assets,
  GpuBlendModesToPixi,
  RenderTexture,
  Sprite,
  State,
  Spritesheet,
  Texture,
} from 'pixi.js';
import { expect, it } from 'vitest';

import atlas from '#examples/assets/wispy-smoke.json';
import smokeImage from '#examples/assets/wispy-smoke.png?url';
import definition from '#examples/effects/wispy-smoke.json';

it('matches WebGL2 smoke alpha on transparent targets without changing Pixi additive sprites', async () => {
  const originalBlend = structuredClone(GpuBlendModesToPixi.add);
  const images: Uint8ClampedArray[] = [];
  for (const backend of ['webgl', 'webgpu'] as const) {
    const app = new Application();
    await app.init({
      preference: [backend],
      preferWebGLVersion: 2,
      width: 512,
      height: 512,
      backgroundAlpha: 0,
      autoStart: false,
    });
    // Pixi shares its sprite shader across renderers. Keep batch limits equal
    // so switching backends cannot reuse a shader with too many bindings.
    app.renderer.limits.maxBatchableTextures = 8;
    const target = RenderTexture.create({ width: 512, height: 512 });
    const source = await Assets.load<Texture>(smokeImage);
    const sheet = new Spritesheet(source, atlas);
    await sheet.parse();
    const frames = sheet.animations.play;
    validateAnimationFrames(frames);
    // JSON fixture literals widen during import; runtime constructor validates them.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const effect = new ParticleEffect(definition as EffectInput, {
      autoUpdate: false,
      emitters: {
        'wispy-smoke': {
          textures: frames,
          playback: 'once-forward',
        },
      },
    });
    app.stage.addChild(effect);
    effect.position.set(256, 330);
    try {
      app.render();
      for (let step = 0; step < 60; step++) {
        effect.update(1 / 60);
      }
      app.renderer.render({ container: app.stage, target, clear: true, clearColor: [0, 0, 0, 0] });
      images.push(new Uint8ClampedArray(app.renderer.extract.pixels({ target }).pixels));
      expect(GpuBlendModesToPixi.add).toEqual(originalBlend);
      const sprite = new Sprite(Texture.WHITE);
      sprite.width = 16;
      sprite.height = 16;
      sprite.alpha = 0.5;
      sprite.blendMode = 'add';
      app.renderer.render({ container: sprite, target, clear: true, clearColor: [0, 0, 0, 0] });
      const ordinaryState = State.for2d();
      ordinaryState.blendMode = 'add';
      const blend =
        'gpu' in app.renderer
          ? app.renderer.state.getColorTargets(ordinaryState, 1, 'rgba8unorm')[0]!.blend
          : originalBlend;
      expect(blend).toEqual(originalBlend);
      sprite.destroy();
    } finally {
      target.destroy(true);
      app.destroy(true, { children: true });
      sheet.destroy(false);
    }
  }
  // Compare alpha directly: extraction implementations can return RGB in different
  // premultiplication conventions, but transparent compositing needs matching alpha.
  let maxAlphaDifference = 0;
  for (let i = 3; i < images[0]!.length; i += 4) {
    maxAlphaDifference = Math.max(maxAlphaDifference, Math.abs(images[0]![i]! - images[1]![i]!));
  }
  expect(maxAlphaDifference).toBeLessThanOrEqual(2);
  expect(images[0]!.some((value, index) => index % 4 === 3 && value > 0 && value < 255)).toBe(true);
});
