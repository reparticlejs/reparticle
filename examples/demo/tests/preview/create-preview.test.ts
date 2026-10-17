import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createPreview } from '#src/preview/create-preview.js';
import type { PreviewHost } from '#src/types/preview-host.js';

import effect from '../../public/effect.json';

const mocks = vi.hoisted(() => ({
  init: vi.fn<() => Promise<void>>(),
  load: vi.fn<() => Promise<Record<string, object>>>(),
  destroyApp: vi.fn<() => void>(),
  destroyView: vi.fn<() => void>(),
  createStats: vi.fn<PreviewHost['createStats']>(),
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

function host() {
  const appendCanvas = vi.fn<PreviewHost['appendCanvas']>();
  const element: PreviewHost = {
    initialize: mocks.init,
    createStats: mocks.createStats,
    appendCanvas,
    getBounds: () => ({ left: 0, top: 0, width: 800, height: 500 }),
  };
  return { element, appendCanvas };
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
    advance: vi.fn<ReturnType<PreviewHost['createStats']>['advance']>(),
    reset: vi.fn<ReturnType<PreviewHost['createStats']>['reset']>(),
    setVisible: vi.fn<ReturnType<PreviewHost['createStats']>['setVisible']>(),
    destroy: mocks.destroyStats,
  });
});
afterEach(() => vi.unstubAllGlobals());

it('destroys an initialization that finishes after React has unmounted', async () => {
  const pending = deferred<void>();
  mocks.init.mockReturnValue(pending.promise);
  const controller = new AbortController();
  const { element: container, appendCanvas } = host();
  const startup = createPreview(container, controller.signal);
  controller.abort();
  pending.resolve();
  expect(await startup).toBeNull();
  expect(mocks.load).not.toHaveBeenCalled();
  expect(appendCanvas).not.toHaveBeenCalled();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('does not attach a canvas when unmounted during texture loading', async () => {
  const pending = deferred<Record<string, object>>();
  mocks.load.mockReturnValue(pending.promise);
  const controller = new AbortController();
  const { element: container, appendCanvas } = host();
  const startup = createPreview(container, controller.signal);
  await vi.waitFor(() => expect(mocks.load).toHaveBeenCalledOnce());
  controller.abort();
  pending.resolve({});
  expect(await startup).toBeNull();
  expect(appendCanvas).not.toHaveBeenCalled();
  expect(mocks.createStats).not.toHaveBeenCalled();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('releases the renderer if loading assets fails', async () => {
  mocks.load.mockRejectedValue(new Error('asset failure'));
  await expect(createPreview(host().element, new AbortController().signal)).rejects.toThrow(
    'asset failure',
  );
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('releases the particle view when stats startup fails', async () => {
  mocks.createStats.mockImplementationOnce(() => {
    throw new Error('stats failure');
  });
  await expect(createPreview(host().element, new AbortController().signal)).rejects.toThrow(
    'stats failure',
  );
  expect(mocks.destroyView).toHaveBeenCalledOnce();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('destroys stats and the owned scene exactly once', async () => {
  const { element: container, appendCanvas } = host();
  const runtime = await createPreview(container, new AbortController().signal);
  expect(appendCanvas).toHaveBeenCalledOnce();
  runtime!.destroy();
  runtime!.destroy();
  expect(mocks.destroyStats).toHaveBeenCalledOnce();
  expect(mocks.destroyView).toHaveBeenCalledOnce();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});

it('releases the scene and application even when stats cleanup fails', async () => {
  const runtime = await createPreview(host().element, new AbortController().signal);
  mocks.destroyStats.mockImplementationOnce(() => {
    throw new Error('cleanup failure');
  });
  expect(() => runtime!.destroy()).toThrow('cleanup failure');
  expect(mocks.destroyView).toHaveBeenCalledOnce();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
  runtime!.destroy();
  expect(mocks.destroyApp).toHaveBeenCalledOnce();
});
