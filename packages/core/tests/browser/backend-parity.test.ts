import { expect, it } from 'vitest';

import { parseEffectConfig } from '#config/parse-effect.js';
import { EmitterController } from '#runtime/emitter-controller.js';
import { Emitter } from '#runtime/webgl2/emitter.js';
import { createSimulationContext } from '#runtime/webgpu/context.js';

import confetti from '../../../../examples/shared/public/effects/confetti.json';
import cyclone from '../../../../examples/shared/public/effects/cyclone.json';
import magicImpact from '../../../../examples/shared/public/effects/magic-impact.json';
import coins from '../../../../examples/shared/public/effects/spinning-coins.json';
import water from '../../../../examples/shared/public/effects/water-stream.json';
import { readGPU } from '../support/read-gpu-texture';

it.each([
  { name: 'magic impact', definition: magicImpact },
  { name: 'water stream', definition: water },
  { name: 'confetti', definition: confetti },
  { name: 'cyclone', definition: cyclone },
  { name: 'spinning coins', definition: coins },
])(
  '$name matches WebGL2 birth and motion state, reset, and shared-pipeline lifetime on WebGPU',
  async ({ definition }) => {
    const adapter = await navigator.gpu.requestAdapter();
    expect(adapter, 'WebGPU adapter required').not.toBeNull();
    const device = await adapter!.requestDevice();
    device.pushErrorScope('validation');
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2')!;
    const framebuffer = gl.createFramebuffer();
    const definitions = parseEffectConfig(definition);
    const glEmitters = definitions.emitters.map(
      (config) => new Emitter({ gl, canvas }, config, definitions.modifiers),
    );
    const gpuEmitters = definitions.emitters.map(
      (config) =>
        new EmitterController(createSimulationContext({ device }), config, definitions.modifiers),
    );
    const readGL = (texture: WebGLTexture, width: number, height: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const data = new Float32Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);
      return Array.from(data);
    };
    const compare = async (stage: string) => {
      for (let index = 0; index < glEmitters.length; index++) {
        const a = glEmitters[index]!;
        const b = gpuEmitters[index]!;
        expect(b.particleCount).toBe(a.particleCount);
        expect([b.width, b.rows], `${stage}: emitter ${index} texture layout`).toEqual([
          a.width,
          a.rows,
        ]);
        for (const [left, right, bands] of [
          [a.texture, b.texture, 2],
          [a.birthTexture, b.birthTexture, 3],
        ] as const) {
          const expected = readGL(left, a.width, a.rows * bands);
          const actual = await readGPU(device, right);
          expect(actual.length).toBe(expected.length);
          // Check every word with the same tolerance, but avoid constructing an
          // assertion for each float in large textures on software-rendered CI.
          // Negating the comparison also rejects NaN, as the old assertion did.
          const mismatch = expected.findIndex(
            (value, word) => !(Math.abs(actual[word]! - value) < 0.005 + Math.abs(value) * 0.0001),
          );
          expect(
            mismatch,
            `${stage}: emitter ${index}, bands ${bands}, word ${mismatch}: WebGL2 ${expected[mismatch]}, WebGPU ${actual[mismatch]}`,
          ).toBe(-1);
        }
      }
    };
    try {
      for (let step = 0; step < 35; step++) {
        for (const emitter of [...glEmitters, ...gpuEmitters]) {
          emitter.update(1 / 60);
        }
        if (step === 0 || step === 10 || step === 34) {
          await compare(`step ${step}`);
        }
      }
      for (const emitter of [...glEmitters, ...gpuEmitters]) {
        emitter.reset();
        emitter.update(1 / 60);
      }
      await compare('after reset');
      glEmitters.pop()!.destroy();
      gpuEmitters.pop()!.destroy();
      for (const emitter of [...glEmitters, ...gpuEmitters]) {
        emitter.update(1 / 60);
      }
      await compare('after destroying another emitter');
    } finally {
      for (const emitter of [...glEmitters, ...gpuEmitters]) {
        emitter.destroy();
      }
      gl.deleteFramebuffer(framebuffer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      const error = await device.popErrorScope();
      device.destroy();
      expect(error?.message).toBeUndefined();
    }
  },
  // Software GPU shader compilation and readbacks take longer on hosted runners.
  60000,
);
