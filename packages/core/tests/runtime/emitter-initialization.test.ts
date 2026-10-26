import { beforeEach, expect, it, vi } from 'vitest';

import { parseEffectConfig } from '#config/parse-effect.js';
import { Emitter } from '#runtime/emitter.js';
import type { EmitterContext } from '#types/emitter.js';

import magicImpact from '../../../../examples/shared/public/effects/magic-impact.json';
import skeleton from '../../../../site/src/content/effect.example.json';

const gpu = vi.hoisted(() => ({
  construct: vi.fn<() => void>(),
  reset: vi.fn<() => void>(),
  clear: vi.fn<() => void>(),
  update: vi.fn<() => void>(),
  destroy: vi.fn<() => void>(),
}));

vi.mock('#runtime/gpu/particle-simulation.js', () => ({
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
const gl = new Context();
gl.getParameter = vi.fn<WebGL2RenderingContext['getParameter']>(() => 16384);
const context: EmitterContext = { gl, canvas: new Canvas() };
const definition = parseEffectConfig(skeleton).emitters[0];

beforeEach(() => vi.clearAllMocks());

it('constructs CPU controls and validates updates without allocating GPU resources', () => {
  const emitter = new Emitter(null, definition);
  const count = emitter.particleCount;
  emitter.x = 42;
  emitter.setParameters({ initial: { speed: 12 } });
  emitter.update(0.1);
  expect(emitter.initialized).toBe(false);
  expect(emitter.particleCount).toBe(count);
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
  const count = emitter.particleCount;
  const state = emitter.state;
  vi.clearAllMocks();
  blocked = true;

  for (const operation of [
    () => emitter.update(0.01),
    () => emitter.play(),
    () => emitter.reset(),
    () => emitter.stop(),
    () => emitter.clear(),
    () => emitter.destroy(),
  ]) {
    expect(operation).toThrow('host is rendering');
    expect(emitter.particleCount).toBe(count);
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

it('emits the magic-impact ring on a slow first frame and after reset', () => {
  const ring = parseEffectConfig(magicImpact).emitters.find((entry) => entry.id === 'ring')!;
  const slow = new Emitter(context, ring);
  const fast = new Emitter(context, ring);
  slow.update(0.1);
  for (let frame = 0; frame < 6; frame++) {
    fast.update(1 / 60);
  }
  expect(slow.particleCount).toBeGreaterThan(0);
  expect(slow.particleCount).toBe(fast.particleCount);
  slow.reset();
  slow.update(0.1);
  expect(slow.particleCount).toBe(fast.particleCount);
  slow.destroy();
  fast.destroy();
});
