import { beforeEach, expect, it, vi } from 'vitest';

import { parseEffectConfig } from '#src/config/parse-effect.js';
import { Emitter } from '#src/runtime/emitter.js';
import type { EmitterContext } from '#types/emitter.js';

import skeleton from '../../../../docs/effect.example.json';

const gpu = vi.hoisted(() => ({
  construct: vi.fn<() => void>(),
  reset: vi.fn<() => void>(),
  clear: vi.fn<() => void>(),
  update: vi.fn<() => void>(),
  destroy: vi.fn<() => void>(),
}));

vi.mock('#src/runtime/gpu/simulation.js', () => ({
  GpuSimulation: class {
    public reset = gpu.reset;
    public clear = gpu.clear;
    public update = gpu.update;
    public destroy = gpu.destroy;
    public constructor() {
      gpu.construct();
    }
  },
}));

// The simulation is mocked: these identities test attachment, not WebGL execution.
const Context = vi.fn<typeof WebGL2RenderingContext>();
const Canvas = vi.fn<typeof HTMLCanvasElement>();
const context: EmitterContext = { gl: new Context(), canvas: new Canvas() };
const definition = parseEffectConfig(skeleton).emitters[0];

beforeEach(() => vi.clearAllMocks());

it('constructs CPU controls and validates updates without allocating GPU resources', () => {
  const emitter = new Emitter(null, definition);
  const revision = emitter.particleRevision;
  emitter.x = 42;
  emitter.setParameters({ initial: { speed: 12 } });
  emitter.update(0.1);
  expect(emitter.initialized).toBe(false);
  expect(emitter.particleRevision).toBe(revision);
  expect(emitter.x).toBe(42);
  expect(emitter.configuration.initial.speed).toBe(12);
  expect(() => emitter.update(Infinity)).toThrow(RangeError);
  expect(() => emitter.texture).toThrow('not been initialized');
  expect(gpu.construct).not.toHaveBeenCalled();
  emitter.destroy();
  expect(gpu.destroy).not.toHaveBeenCalled();
});

it('warms both GPU paths once without resetting controls or stop state', () => {
  const emitter = new Emitter(null, definition);
  emitter.x = 19;
  emitter.emitting = false;
  emitter.stop({ clear: true });
  const listener = vi.fn<() => void>();
  emitter.onStateChange(listener);
  const state = emitter.state;
  emitter.initialize(context);
  expect(emitter.initialized).toBe(true);
  expect(emitter.gl).toBe(context.gl);
  expect(emitter.state).toBe(state);
  expect(emitter.x).toBe(19);
  expect(emitter.emitting).toBe(false);
  expect(listener).not.toHaveBeenCalled();
  expect(gpu.update).toHaveBeenCalledTimes(2);
  emitter.initialize(context);
  expect(gpu.construct).toHaveBeenCalledTimes(1);
  expect(gpu.update).toHaveBeenCalledTimes(2);
  emitter.destroy();
  emitter.destroy();
  expect(gpu.destroy).toHaveBeenCalledTimes(1);
});

it('starts updates after attachment and rejects migration to another context', () => {
  const emitter = new Emitter(null, definition);
  emitter.initialize(context);
  const before = gpu.update.mock.calls.length;
  emitter.update(0.01);
  expect(gpu.update.mock.calls.length).toBeGreaterThan(before);
  expect(() => emitter.initialize({ ...context, gl: new Context() })).toThrow(
    'cannot move between WebGL contexts',
  );
  emitter.destroy();
});

it('releases failed initialization and permits a clean retry', () => {
  const emitter = new Emitter(null, definition);
  gpu.update.mockImplementationOnce(() => {
    throw new Error('compile failed');
  });
  expect(() => emitter.initialize(context)).toThrow('compile failed');
  expect(emitter.initialized).toBe(false);
  expect(gpu.destroy).toHaveBeenCalledTimes(1);
  emitter.initialize(context);
  expect(emitter.initialized).toBe(true);
  emitter.destroy();
});

it('rejects host-prohibited operations before CPU or GPU state changes', () => {
  let blocked = false;
  const assertAvailable = () => {
    if (blocked) {
      throw new Error('host is rendering');
    }
  };
  const restoreState = vi.fn<() => void>();
  const emitter = new Emitter(null, definition);
  const guardedContext = { ...context, assertAvailable, restoreState };

  blocked = true;
  expect(() => emitter.initialize(guardedContext)).toThrow('host is rendering');
  expect(gpu.construct).not.toHaveBeenCalled();
  expect(restoreState).not.toHaveBeenCalled();

  blocked = false;
  emitter.initialize(guardedContext);
  emitter.emitting = false;
  const revision = emitter.particleRevision;
  const state = emitter.state;
  vi.clearAllMocks();
  blocked = true;

  for (const operation of [
    () => emitter.update(0.01),
    () => emitter.emitBurst(2),
    () => emitter.play(),
    () => emitter.reset(),
    () => emitter.stop(),
    () => emitter.clear(),
    () => emitter.destroy(),
  ]) {
    expect(operation).toThrow('host is rendering');
    expect(emitter.particleRevision).toBe(revision);
    expect(emitter.state).toBe(state);
    expect(emitter.emitting).toBe(false);
  }
  expect(gpu.update).not.toHaveBeenCalled();
  expect(gpu.reset).not.toHaveBeenCalled();
  expect(gpu.clear).not.toHaveBeenCalled();
  expect(gpu.destroy).not.toHaveBeenCalled();
  expect(restoreState).not.toHaveBeenCalled();

  blocked = false;
  emitter.play();
  emitter.update(0.01);
  emitter.destroy();
  expect(gpu.destroy).toHaveBeenCalledOnce();
});

it('restores host state before notifications and when simulation fails', () => {
  let restored = false;
  const restoreState = vi.fn<() => void>(() => {
    restored = true;
  });
  const emitter = new Emitter({ ...context, restoreState }, definition);
  const listener = vi.fn<() => void>(() => expect(restored).toBe(true));
  emitter.onStateChange(listener);
  restored = false;
  emitter.update(0.1);
  expect(listener).toHaveBeenCalled();

  restored = false;
  gpu.update.mockImplementationOnce(() => {
    throw new Error('GPU failure');
  });
  expect(() => emitter.update(0.1)).toThrow('GPU failure');
  expect(restored).toBe(true);
  emitter.destroy();
});

it('combines bursts with rate, preserves living slots, and resets the burst schedule', () => {
  const config = parseEffectConfig({
    ...skeleton,
    emitters: [
      {
        ...definition,
        capacity: 5,
        duration: 1,
        playMode: 'once',
        startOffset: 0,
        emission: {
          ...definition.emission,
          rate: 10,
          bursts: [{ time: 0, count: 10, countSpread: 0, probability: 1 }],
        },
        initial: { ...definition.initial, lifetime: 2 },
      },
    ],
  }).emitters[0];
  const emitter = new Emitter(context, config);
  const order = new Uint32Array(5);
  emitter.update(0);
  expect(emitter.copyParticleOrder(order)).toBe(0);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(5);
  const firstOrder = order.slice();
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(5);
  expect(order).toEqual(firstOrder);
  emitter.reset();
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(5);
  emitter.destroy();
});

it('consumes disabled bursts and processes bursts during prewarm', () => {
  const config = parseEffectConfig({
    ...skeleton,
    emitters: [
      {
        ...definition,
        duration: 1,
        playMode: 'loop',
        startOffset: 0,
        emission: {
          ...definition.emission,
          rate: 0,
          bursts: [{ time: 0, count: 3, countSpread: 0, probability: 1 }],
        },
        initial: { ...definition.initial, lifetime: 2 },
      },
    ],
  }).emitters[0];
  const emitter = new Emitter(context, config);
  const order = new Uint32Array(config.capacity);
  emitter.emitting = false;
  emitter.update(0.1);
  emitter.emitting = true;
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(0);
  emitter.destroy();
  const prewarmed = new Emitter(context, { ...config, startOffset: 0.5 });
  prewarmed.update(0.01);
  expect(prewarmed.copyParticleOrder(order)).toBe(3);
  prewarmed.destroy();
});

it('adds rate births to bursts and keeps the schedule when rate changes', () => {
  const emitter = new Emitter(context, {
    ...definition,
    capacity: 20,
    duration: 1,
    startOffset: 0,
    emission: {
      ...definition.emission,
      rate: 10,
      bursts: [
        { time: 0, count: 3, countSpread: 0, probability: 1 },
        { time: 0.3, count: 2, countSpread: 0, probability: 1 },
      ],
    },
    initial: { ...definition.initial, lifetime: 2 },
  });
  const order = new Uint32Array(20);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(4);
  emitter.setParameters({ emission: { rate: 20 } });
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(6);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(10);
  emitter.stop();
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(10);
  emitter.destroy();
});

it('does not replay dropped bursts after occupied slots become free', () => {
  const emitter = new Emitter(context, {
    ...definition,
    capacity: 2,
    duration: 2,
    startOffset: 0,
    emission: {
      ...definition.emission,
      rate: 0,
      bursts: [
        { time: 0, count: 2, countSpread: 0, probability: 1 },
        { time: 0.2, count: 5, countSpread: 0, probability: 1 },
      ],
    },
    initial: { ...definition.initial, lifetime: 0.25 },
  });
  const order = new Uint32Array(2);
  emitter.update(0.1);
  emitter.update(0.1);
  expect(emitter.copyParticleOrder(order)).toBe(2);
  for (let step = 0; step < 5; step++) {
    emitter.update(0.1);
  }
  expect(emitter.copyParticleOrder(order)).toBe(0);
  emitter.destroy();
});

it('prewarms repeated bursts and reproduces the same population after reset', () => {
  const emitter = new Emitter(context, {
    ...definition,
    capacity: 100,
    duration: 0.1,
    playMode: 'loop',
    startOffset: 0.25,
    emission: {
      ...definition.emission,
      rate: 0,
      bursts: [{ time: 0, count: 3, countSpread: 0, probability: 1 }],
    },
    initial: { ...definition.initial, lifetime: 2 },
  });
  const order = new Uint32Array(100);
  emitter.update(0.01);
  expect(emitter.copyParticleOrder(order)).toBe(9);
  emitter.reset();
  emitter.update(0.01);
  expect(emitter.copyParticleOrder(order)).toBe(9);
  emitter.destroy();
});
