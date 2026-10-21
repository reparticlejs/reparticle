import { parseEffectConfig } from '@reparticle/core';
import { ParticleEffect } from '@reparticle/pixi';
import { Ticker, UPDATE_PRIORITY } from 'pixi.js';
import { expect, it, vi } from 'vitest';

import effect from '../fixtures/effect.json';

const definition = parseEffectConfig(effect);

it.each([
  { speed: 1, elapsed: 16, minFPS: 10 },
  { speed: 2, elapsed: 100, minFPS: 10 },
  { speed: 2.5, elapsed: 100, minFPS: 10 },
  { speed: 1, elapsed: 250, minFPS: 1 },
  { speed: 0, elapsed: 100, minFPS: 10 },
])('preserves scaled ticker time and allows rendering: %j', ({ speed, elapsed, minFPS }) => {
  const ticker = new Ticker();
  ticker.speed = speed;
  ticker.minFPS = minFPS;
  const particles = new ParticleEffect(definition, { ticker });
  const update = vi.spyOn(particles, 'update');
  const render = vi.fn<() => void>();
  ticker.add(render, undefined, UPDATE_PRIORITY.LOW);

  try {
    ticker.lastTime = 0;
    ticker.update(elapsed);
    const steps = update.mock.calls.map(([seconds]) => seconds);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((seconds) => seconds >= 0 && seconds <= 0.1)).toBe(true);
    expect(steps.reduce((total, seconds) => total + seconds, 0)).toBeCloseTo(
      (elapsed * speed) / 1000,
    );
    expect(render).toHaveBeenCalledOnce();
    expect(update.mock.invocationCallOrder.at(-1)).toBeLessThan(
      render.mock.invocationCallOrder[0]!,
    );
  } finally {
    particles.destroy();
    ticker.destroy();
  }
});

it('stops remaining substeps if the effect is destroyed during an update', () => {
  const ticker = new Ticker();
  ticker.speed = 3;
  const particles = new ParticleEffect(definition, { ticker });
  const update = vi
    .spyOn(particles.emitter, 'update')
    .mockImplementation(() => particles.destroy());
  try {
    ticker.lastTime = 0;
    ticker.update(100);
    expect(update).toHaveBeenCalledOnce();
    expect(ticker.count).toBe(0);
  } finally {
    particles.destroy();
    ticker.destroy();
  }
});

it('keeps the explicit update limit for manual callers', () => {
  const particles = new ParticleEffect(definition, { autoUpdate: false });
  try {
    expect(() => particles.update(0.2)).toThrow('Step must be between 0 and 0.1 seconds');
  } finally {
    particles.destroy();
  }
});
