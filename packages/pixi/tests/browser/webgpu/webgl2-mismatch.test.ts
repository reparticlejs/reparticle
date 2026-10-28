import { ParticleEffect } from '@reparticle/pixi/webgl2';
import { Application } from 'pixi.js';
import { it, expect } from 'vitest';
it('reports an explicit backend mismatch', async () => {
  const app = new Application();
  await app.init({ preference: ['webgpu'], autoStart: false, width: 16, height: 16 });
  const effect = app.stage.addChild(
    new ParticleEffect(
      {
        version: 1,
        emitters: [
          {
            id: 'test',
            seed: 1,
            capacity: 4,
            emission: { rate: 1, shape: { type: 'point' } },
            initial: { lifetime: 1, speed: 0, direction: 0, spread: 0, size: 8 },
          },
        ],
      },
      { autoUpdate: false },
    ),
  );
  try {
    expect(() => app.render()).toThrow('not loaded');
  } finally {
    effect.destroy();
    app.destroy(true, { children: true });
  }
});
