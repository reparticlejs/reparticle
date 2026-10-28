import { expect, it } from 'vitest';

import { parseEffectConfig } from '#config/parse-effect.js';
import confetti from '#examples/effects/confetti.json';
import cyclone from '#examples/effects/cyclone.json';
import magicImpact from '#examples/effects/magic-impact.json';
import coins from '#examples/effects/spinning-coins.json';
import water from '#examples/effects/water-stream.json';
import { EmitterController } from '#runtime/emitter-controller.js';
import { Emitter } from '#runtime/webgl2/emitter.js';
import { createSimulationContext } from '#runtime/webgpu/context.js';
import { readGPU } from '#test-support/read-gpu-texture';

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
          // Keep checking after a mismatch so CI reports birth data, motion,
          // and later steps together. Soft assertions still fail the test.
          const fields =
            bands === 2
              ? [
                  'position.x',
                  'position.y',
                  'velocity.x',
                  'velocity.y',
                  'age',
                  'alive',
                  'rotation',
                  'heading',
                ]
              : [
                  'lifetime',
                  'size',
                  'initialRotation',
                  'modifierVariation',
                  'red',
                  'green',
                  'blue',
                  'alpha',
                  'angularVelocity',
                  'stretch.x',
                  'stretch.y',
                  'handedness',
                ];
          const wordsPerBand = a.width * a.rows * 4;
          const failures: string[] = [];
          let mismatchCount = 0;
          let largestDifference = 0;
          for (let word = 0; word < expected.length; word++) {
            const difference = Math.abs(actual[word]! - expected[word]!);
            // Negating the comparison also rejects NaN.
            if (!(difference < 0.005 + Math.abs(expected[word]!) * 0.0001)) {
              mismatchCount++;
              largestDifference = Math.max(largestDifference, difference);
              if (failures.length < 8) {
                const field = fields[Math.floor(word / wordsPerBand) * 4 + (word % 4)];
                const slot = Math.floor((word % wordsPerBand) / 4);
                failures.push(
                  `${field}, slot ${slot}: WebGL2 ${expected[word]}, WebGPU ${actual[word]}`,
                );
              }
            }
          }
          expect
            .soft(
              mismatchCount,
              `${stage}: emitter ${index}, ${bands === 2 ? 'motion' : 'birth'}: ` +
                `${mismatchCount} mismatches, largest difference ${largestDifference}\n${failures.join('\n')}`,
            )
            .toBe(0);
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
