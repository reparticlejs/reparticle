// Dependencies are installed from tarballs in a temporary app by check-packed-consumer.ts.
/* eslint-disable import-js/no-extraneous-dependencies */
import { parseEffectConfig, effectConfigSchema, EmitterController } from '@reparticle/core';
import { Emitter as WebGL2Emitter } from '@reparticle/core/webgl2';
import { Emitter as WebGPUEmitter } from '@reparticle/core/webgpu';
import { ParticleEffect, type EffectInput, type ParticleEffectOptions } from '@reparticle/pixi';
import { ParticleEffect as WebGL2Effect } from '@reparticle/pixi/webgl2';
import { ParticleEffect as WebGPUEffect } from '@reparticle/pixi/webgpu';
import { Application, Texture, Rectangle, type WebGLRenderer } from 'pixi.js';

const definition: EffectInput = {
  version: 1,
  emitters: [
    {
      id: 'smoke',
      capacity: 64,
      seed: 42,
      emission: { rate: 60, shape: { type: 'point' } },
      initial: { lifetime: 2, speed: 0, direction: 0, spread: 0, size: 32 },
    },
  ],
};
const sameAPI: (typeof ParticleEffect)[] = [WebGL2Effect, WebGPUEffect];
if (
  sameAPI.length !== 2 ||
  typeof WebGPUEmitter !== 'function' ||
  typeof WebGL2Emitter !== 'function' ||
  typeof EmitterController !== 'function'
) {
  throw new Error('Missing explicit backend exports');
}
const options: ParticleEffectOptions = {
  autoUpdate: false,
  emitters: { smoke: { textures: [Texture.WHITE] } },
};
parseEffectConfig(definition);
if (effectConfigSchema.safeParse({}).success) {
  throw new Error('Invalid effect accepted');
}
const app = new Application<WebGLRenderer>();
await app.init({
  width: 128,
  height: 128,
  preference: 'webgl',
  preferWebGLVersion: 2,
  autoStart: false,
});
document.body.append(app.canvas);
const effect = new ParticleEffect(definition, options);
effect.position.set(64, 64);
app.stage.addChild(effect);
app.render();
effect.update(0.1);
app.render();
const pixels = app.renderer.extract.pixels({
  target: app.stage,
  frame: new Rectangle(0, 0, 128, 128),
}).pixels;
if (pixels[(64 * 128 + 64) * 4]! < 200 || effect.emitter.particleCount === 0) {
  throw new Error('Particles did not render');
}
effect.destroy();
app.destroy(true, { children: true });
document.body.dataset.passed = 'true';
