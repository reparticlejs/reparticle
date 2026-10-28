import { expect, it, vi } from 'vitest';

import { parseEffectConfig } from '#config/parse-effect.js';
import impact from '#examples/effects/magic-impact.json';
import water from '#examples/effects/water-stream.json';
import { EmitterController } from '#runtime/emitter-controller.js';
import { createSimulationParameters } from '#runtime/shared/parameters.js';
import { createSimulationContext } from '#runtime/webgpu/context.js';
import { readGPU } from '#test-support/read-gpu-texture';

it.each([water, impact])(
  'preserves exact GPU state through batched updates and lifecycle operations',
  async (fixture) => {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter!.requestDevice();
    device.pushErrorScope('validation');
    const config = parseEffectConfig(fixture);
    const context = createSimulationContext({ device });
    const definitions = config.emitters.map((emitter) => ({
      ...emitter,
      capacity: 128,
      startOffset: 0.1,
    }));
    const batched = definitions.map(
      (emitter) => new EmitterController(context, emitter, config.modifiers),
    );
    const direct = definitions.map(
      (emitter) =>
        new EmitterController(createSimulationContext({ device }), emitter, config.modifiers),
    );
    const compare = async () => {
      for (let i = 0; i < batched.length; i++) {
        expect(batched[i]!.particleCount).toBe(direct[i]!.particleCount);
        expect(await readGPU(device, batched[i]!.texture)).toEqual(
          await readGPU(device, direct[i]!.texture),
        );
        expect(await readGPU(device, batched[i]!.birthTexture)).toEqual(
          await readGPU(device, direct[i]!.birthTexture),
        );
      }
    };
    const advance = (emitters: typeof batched) => {
      for (const emitter of emitters) {
        emitter.update(1 / 60);
      }
    };
    try {
      for (let step = 0; step < 12; step++) {
        context.batchUpdates!(() => advance(batched));
        advance(direct);
      }
      await compare();
      const submit = vi.spyOn(device.queue, 'submit');
      context.batchUpdates!(() => advance(batched));
      expect(submit).toHaveBeenCalledTimes(1);
      submit.mockRestore();
      advance(direct);
      await compare();
      // Repeated steps must consume their own uploads, even inside nested batches.
      context.batchUpdates!(() => {
        batched[0]!.update(0.01);
        context.batchUpdates!(() => {
          batched[0]!.update(0.02);
          advance(batched);
        });
      });
      direct[0]!.update(0.01);
      direct[0]!.update(0.02);
      advance(direct);
      await compare();
      const change = (emitters: typeof batched) => {
        emitters[0]!.setParameters({ initial: { speed: 23, angularVelocity: 17 } });
        advance(emitters);
        emitters[0]!.reset();
        emitters[1]!.stop({ clear: true });
        advance(emitters);
      };
      context.batchUpdates!(() => change(batched));
      change(direct);
      await compare();
      let duringBatch: Promise<number[]> | undefined;
      context.batchUpdates!(() => {
        advance(batched);
        duringBatch = readGPU(device, batched[0]!.texture);
        advance(batched);
      });
      advance(direct);
      expect(await duringBatch).toEqual(await readGPU(device, direct[0]!.texture));
      advance(direct);
      await compare();
      expect(() =>
        context.batchUpdates!(() => {
          advance(batched);
          throw new Error('later failure');
        }),
      ).toThrow('later failure');
      advance(direct);
      await compare();
      context.batchUpdates!(() => {
        advance(batched);
        batched.pop()!.destroy();
        advance(batched);
      });
      advance(direct);
      direct.pop()!.destroy();
      advance(direct);
      await compare();
    } finally {
      vi.restoreAllMocks();
      for (const emitter of [...batched, ...direct]) {
        emitter.destroy();
      }
      const error = await device.popErrorScope();
      device.destroy();
      expect(error?.message).toBeUndefined();
    }
  },
);

it('skips identical float32 uniforms but detects in-place changes and restores old values', async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter!.requestDevice();
  device.pushErrorScope('validation');
  const simulation = createSimulationContext({ device }).createSimulation(8, 4, 32);
  const parameters = createSimulationParameters();
  parameters.rotationCurve = new Float32Array(65);
  parameters.modifiers = new Float32Array(16);
  parameters.step.seconds = 0.1;
  simulation.clear();
  const writes = vi.spyOn(device.queue, 'writeBuffer');
  try {
    simulation.update(parameters);
    expect(writes).toHaveBeenCalledTimes(1);
    parameters.step.seconds = Math.fround(0.1);
    simulation.update(parameters);
    expect(writes).toHaveBeenCalledTimes(1);
    parameters.rotationCurve[4] = 2;
    simulation.update(parameters);
    expect(writes).toHaveBeenCalledTimes(2);
    parameters.rotationCurve[4] = 0;
    parameters.modifiers[0] = 1;
    parameters.modifiers[8] = 3;
    simulation.update(parameters);
    expect(writes).toHaveBeenCalledTimes(3);
    parameters.rotationCurve[5] = -0;
    simulation.update(parameters);
    expect(writes).toHaveBeenCalledTimes(4);
    simulation.reset();
    simulation.update(parameters);
    expect(writes).toHaveBeenCalledTimes(4);
  } finally {
    writes.mockRestore();
    simulation.destroy();
    const error = await device.popErrorScope();
    device.destroy();
    expect(error?.message).toBeUndefined();
  }
});

it('submits pending steps before state listeners can inspect GPU results', async () => {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter!.requestDevice();
  const context = createSimulationContext({ device });
  const config = parseEffectConfig(water).emitters[0];
  const emitter = new EmitterController(context, { ...config, capacity: 128 });
  const submit = vi.spyOn(device.queue, 'submit');
  const listener = vi.fn<() => void>(() => {
    expect(submit).toHaveBeenCalled();
    // A nested update must submit before this same callback can issue a GPU read.
    const before = submit.mock.calls.length;
    emitter.update(0.01);
    expect(submit.mock.calls.length).toBeGreaterThan(before);
  });
  emitter.onStateChange(listener);
  try {
    context.batchUpdates!(() => emitter.update(1 / 60));
    expect(listener).toHaveBeenCalled();
  } finally {
    submit.mockRestore();
    emitter.destroy();
    device.destroy();
  }
});
