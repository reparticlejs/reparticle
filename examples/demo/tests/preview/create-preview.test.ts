import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { Stats } from '#src/devtools/types/stats.js';
import { createPreview } from '#src/preview/create-preview.js';

import effect from '../../public/effect.json';

const mocks = vi.hoisted(() => ({
  init: vi.fn<() => Promise<void>>(),
  load: vi.fn<() => Promise<Record<string, object>>>(),
  destroyApp: vi.fn<() => void>(),
  destroyView: vi.fn<() => void>(),
  createStats: vi.fn<() => Stats>(),
  destroyStats: vi.fn<() => void>(),
}));

vi.mock('pixi.js', () => ({
  Application: class {
    renderer = { gl: {} };
    canvas = {};
    screen = { width: 800, height: 500 };
    ticker = { add: vi.fn<() => void>(), remove: vi.fn<() => void>(), lastTime: 0 };
    children: { destroy?: () => void }[] = [];
    stage = {
      addChild: (child: { destroy?: () => void }) => this.children.push(child),
      removeChild: (child: { destroy?: () => void }) => {
        this.children = this.children.filter((entry) => entry !== child);
      },
    };
    init = mocks.init;
    destroy() {
      mocks.destroyApp();
      this.children.forEach((child) => child.destroy?.());
    }
  },
  Graphics: class {
    roundRect() {
      return this;
    }
    fill() {
      return this;
    }
  },
  Assets: { load: mocks.load },
}));
vi.mock('@reparticle/pixi', () => ({
  ParticleView: class {
    emitter = { x: 0, y: 0 };
    destroy = mocks.destroyView;
  },
}));
vi.mock('#src/devtools/index.ts', () => ({ createStats: mocks.createStats }));

function host() {
  const appendChild = vi.fn<HTMLDivElement['appendChild']>();
  const element = { clientWidth: 800, clientHeight: 500, appendChild };
  return { element, appendChild };
}

function createTestPreview(container: ReturnType<typeof host>['element'], signal: AbortSignal) {
  // Pixi and stats are mocked; these lifecycle tests only use the host members above.
  // @ts-expect-error The test double deliberately omits unused DOM members.
  return createPreview(container, signal);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('window', { devicePixelRatio: 1 });
  vi.stubGlobal(
    'fetch',
    vi
      .fn<() => Promise<{ ok: boolean; json: () => Promise<typeof effect> }>>()
      .mockResolvedValue({ ok: true, json: async () => effect }),
  );
  mocks.init.mockResolvedValue();
  mocks.load.mockResolvedValue({
    '/textures/star.svg': {},
    '/textures/leaf.svg': {},
    '/textures/spark.svg': {},
  });
  mocks.createStats.mockReturnValue({
    show: vi.fn<() => void>(),
    hide: vi.fn<() => void>(),
    destroy: mocks.destroyStats,
  });
});
afterEach(() => vi.unstubAllGlobals());

it('destroys an initialization that finishes after React has unmounted', async () => {
  const pending = deferred<void>();
  mocks.init.mockReturnValue(pending.promise);
  const controller = new AbortController();
  const { element: container, appendChild } = host();
  const startup = createTestPreview(container, controller.signal);
  controller.abort();
  pending.resolve();
  expect(await startup).toBeNull();
  expect(mocks.load).not.toHaveBeenCalled();
  expect(appendChild).not.toHaveBeenCalled();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('does not attach a canvas when unmounted during texture loading', async () => {
  const pending = deferred<Record<string, object>>();
  mocks.load.mockReturnValue(pending.promise);
  const controller = new AbortController();
  const { element: container, appendChild } = host();
  const startup = createTestPreview(container, controller.signal);
  await vi.waitFor(() => expect(mocks.load).toHaveBeenCalledOnce());
  controller.abort();
  pending.resolve({});
  expect(await startup).toBeNull();
  expect(appendChild).not.toHaveBeenCalled();
  expect(mocks.createStats).not.toHaveBeenCalled();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('releases the renderer if loading assets fails', async () => {
  mocks.load.mockRejectedValue(new Error('asset failure'));
  await expect(createTestPreview(host().element, new AbortController().signal)).rejects.toThrow(
    'asset failure',
  );
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('releases the particle view when stats startup fails', async () => {
  mocks.createStats.mockImplementationOnce(() => {
    throw new Error('stats failure');
  });
  await expect(createTestPreview(host().element, new AbortController().signal)).rejects.toThrow(
    'stats failure',
  );
  expect(mocks.destroyView).toHaveBeenCalledOnce();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('destroys stats and the owned scene exactly once', async () => {
  const { element: container, appendChild } = host();
  const runtime = await createTestPreview(container, new AbortController().signal);
  expect(appendChild).toHaveBeenCalledOnce();
  runtime!.destroy();
  runtime!.destroy();
  expect(mocks.destroyStats).toHaveBeenCalledOnce();
  expect(mocks.destroyView).toHaveBeenCalledOnce();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('releases the scene and application even when stats cleanup fails', async () => {
  const runtime = await createTestPreview(host().element, new AbortController().signal);
  mocks.destroyStats.mockImplementationOnce(() => {
    throw new Error('cleanup failure');
  });
  expect(() => runtime!.destroy()).toThrow('cleanup failure');
  expect(mocks.destroyView).toHaveBeenCalledOnce();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
  runtime!.destroy();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});
