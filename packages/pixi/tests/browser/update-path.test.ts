import { ParticleEffect, type EffectInput } from '@reparticle/pixi';
import { Application } from 'pixi.js';
import { expect, it, vi } from 'vitest';

it.each([1, 2])(
  'keeps %i-emitter updates immediate before attachment and selects batching after attachment',
  async (count) => {
    const app = new Application();
    await app.init({ preference: ['webgpu'], width: 32, height: 32, autoStart: false });
    const emitterDefinition: EffectInput['emitters'][number] = {
      id: 'first',
      capacity: 8,
      seed: 1,
      emission: { rate: 10, shape: { type: 'point' } },
      initial: { lifetime: 2, speed: 0, size: 4, direction: 0, spread: 0 },
    };
    const definition: EffectInput = {
      version: 1,
      emitters: [
        emitterDefinition,
        ...(count === 2 ? [{ ...emitterDefinition, id: 'second' }] : []),
      ],
    };
    const effect = new ParticleEffect(definition, { autoUpdate: false });
    if (!('gpu' in app.renderer)) {
      throw new Error('Expected WebGPU');
    }
    const submit = vi.spyOn(app.renderer.gpu.device.queue, 'submit');
    try {
      effect.update(0.1);
      expect(submit).not.toHaveBeenCalled();
      app.stage.addChild(effect);
      app.render();
      // The initial transition publishes state for listeners before steady updates.
      effect.update(0.1);
      submit.mockClear();
      effect.update(0.1);
      expect(submit).toHaveBeenCalledTimes(1);
      expect([...effect.emitters.values()].every((emitter) => emitter.particleCount > 0)).toBe(
        true,
      );
      // Leaving the stage keeps the initialized path and resources alive.
      app.stage.removeChild(effect);
      submit.mockClear();
      effect.update(0.1);
      expect(submit).toHaveBeenCalledTimes(1);
      effect.pause();
      submit.mockClear();
      effect.update(0.1);
      expect(submit).not.toHaveBeenCalled();
      effect.resume();
      effect.update(0.1);
      expect(submit).toHaveBeenCalledTimes(1);
      effect.destroy();
      submit.mockClear();
      effect.update(0.1);
      expect(submit).not.toHaveBeenCalled();
    } finally {
      submit.mockRestore();
      effect.destroy();
      app.destroy(true, { children: true });
    }
  },
);
