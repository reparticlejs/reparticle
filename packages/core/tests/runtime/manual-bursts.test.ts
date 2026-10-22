import { expect, it, vi } from 'vitest';

import { parseEffectConfig } from '#src/config/parse-effect.js';
import { Emitter } from '#src/runtime/emitter.js';
import type { EmitterContext } from '#types/emitter.js';

import skeleton from '../../../../docs/effect.example.json';

vi.mock('#src/runtime/gpu/simulation.js', () => ({
  GpuSimulation: class {
    public reset() {}
    public clear() {}
    public update() {}
    public destroy() {}
  },
}));

// Exercise scheduling and slot allocation without a browser or GPU readbacks.
const Context = vi.fn<typeof WebGL2RenderingContext>();
const Canvas = vi.fn<typeof HTMLCanvasElement>();
const context: EmitterContext = { gl: new Context(), canvas: new Canvas() };
const original = parseEffectConfig(skeleton).emitters[0];
const definition = {
  ...original,
  capacity: 20,
  duration: 1,
  startOffset: 0,
  emission: { ...original.emission, rate: 0, bursts: [] },
  initial: { ...original.initial, lifetime: 1 },
};

it('queues before attachment and waits for positive time after prewarm', () => {
  const emitter = new Emitter(null, { ...definition, startOffset: 0.5 });
  const order = new Uint32Array(20);
  emitter.emitBurst(3);
  emitter.emitBurst(2);
  emitter.update(0.1);
  emitter.initialize(context);
  emitter.update(0);
  expect(emitter.copyParticleOrder(order)).toBe(0);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(5);
  for (let step = 0; step < 5; step++) {
    emitter.update(0.1);
  }
  expect(emitter.copyParticleOrder(order)).toBe(5);
  emitter.destroy();
});

it('bypasses delay, the emitting gate, and scheduled probability', () => {
  const emitter = new Emitter(context, {
    ...definition,
    startDelay: 1,
    emission: {
      ...definition.emission,
      bursts: [{ time: 0, count: 10, countSpread: 0, probability: 0 }],
    },
  });
  emitter.emitting = false;
  emitter.emitBurst(3);
  emitter.update(0.1);
  expect(emitter.state).toBe('prespawn');
  expect(emitter.copyParticleOrder(new Uint32Array(20))).toBe(3);
  emitter.destroy();
});

it('preserves living slots, combines rate births, and drops overflow without a backlog', () => {
  const emitter = new Emitter(context, {
    ...definition,
    capacity: 5,
    emission: { ...definition.emission, rate: 10 },
    initial: { ...definition.initial, lifetime: 0.5 },
  });
  const order = new Uint32Array(5);
  emitter.emitBurst(2);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(3);
  const firstSlots = Array.from(order.slice(0, 3));
  emitter.emitBurst(100);
  emitter.emitBurst(100);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(5);
  expect(Array.from(order)).toEqual(expect.arrayContaining(firstSlots));
  emitter.setParameters({ emission: { rate: 0 } });
  for (let step = 0; step < 8; step++) {
    emitter.update(0.1);
  }
  expect(emitter.copyParticleOrder(order)).toBe(0);
  emitter.destroy();
});

it('wakes a sleeping emitter to drain without restarting scheduled emission', () => {
  const emitter = new Emitter(context, { ...definition, duration: 0, playMode: 'once' });
  emitter.update(0.1);
  expect(emitter.state).toBe('sleeping');
  const states: string[] = [];
  emitter.onStateChange((event) => states.push(event.state));
  emitter.emitBurst(3);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(new Uint32Array(20))).toBe(3);
  expect(emitter.state).toBe('postspawn');
  for (let step = 0; step < 12; step++) {
    emitter.update(0.1);
  }
  expect(states).toEqual(['postspawn', 'sleeping']);
  emitter.emitBurst(2);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(new Uint32Array(20))).toBe(2);
  emitter.destroy();
});

it.each(['stop', 'clear', 'reset', 'play'] as const)(
  '%s cancels queued manual bursts',
  (operation) => {
    const emitter = new Emitter(context, definition);
    emitter.emitBurst(5);
    emitter[operation]();
    emitter.update(0.1);
    expect(emitter.copyParticleOrder(new Uint32Array(20))).toBe(0);
    emitter.destroy();
  },
);

it('validates counts without discarding valid pending requests; zero does not wake', () => {
  const emitter = new Emitter(context, { ...definition, duration: 0, playMode: 'once' });
  emitter.update(0.1);
  emitter.emitBurst(0);
  emitter.update(0.1);
  expect(emitter.state).toBe('sleeping');
  emitter.emitBurst(2);
  for (const count of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => emitter.emitBurst(count)).toThrow(RangeError);
  }
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(new Uint32Array(20))).toBe(2);
  emitter.destroy();
  expect(() => emitter.emitBurst(1)).toThrow('destroyed');
});
