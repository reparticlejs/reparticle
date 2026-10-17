import { expect, it, vi } from 'vitest';

import { createPreviewController } from '#src/preview/create-preview-controller.js';
import type { ParticlePreview, PreviewControls } from '#src/types/preview.js';

function setup() {
  const controls: PreviewControls = {
    capacity: 8192,
    shape: 'point',
    startOffset: 0,
    startDelay: 0,
    duration: 1,
    orientation: 'default',
    playMode: 'loop',
    diameter: 100,
    width: 200,
    height: 100,
    rate: 3000,
    gravity: 160,
    lifetime: 2,
    texture: 'star',
    size: 24,
    sizeCurve: 'effect',
    rotation: 0,
    rotationCurve: 'effect',
    alpha: 1,
    alphaCurve: 'effect',
    red: 1,
    green: 1,
    blue: 1,
    colorCurve: 'effect',
    paused: false,
    statsVisible: true,
  };
  const runtime = {
    controls,
    setControls: vi.fn<(patch: Partial<PreviewControls>) => PreviewControls>((patch) => ({
      ...controls,
      ...patch,
    })),
    reset: vi.fn<() => void>(),
    movePointer: vi.fn<(x: number, y: number) => void>(),
    destroy: vi.fn<() => void>(),
  } satisfies ParticlePreview;
  const events = {
    onChange: vi.fn<(controls: PreviewControls) => void>(),
    onError: vi.fn<(message: string) => void>(),
  };
  return { runtime, events, controller: createPreviewController(events) };
}

it('publishes applied settings and reports a failed update without changing UI settings', () => {
  const { runtime, events, controller } = setup();
  controller.attach(runtime);
  controller.setControls({ rate: 4000 });
  expect(events.onChange).toHaveBeenLastCalledWith({ ...runtime.controls, rate: 4000 });
  vi.mocked(runtime.setControls).mockImplementationOnce(() => {
    throw new Error('update failed');
  });
  events.onChange.mockClear();
  controller.setControls({ rate: -1 });
  expect(events.onChange).not.toHaveBeenCalled();
  expect(events.onError).toHaveBeenLastCalledWith('Error: update failed');
});

it('stops dispatching after detach and leaves resource destruction to the owner', () => {
  const { runtime, controller } = setup();
  const detach = controller.attach(runtime);
  controller.reset();
  controller.movePointer(10, 20);
  detach();
  controller.reset();
  controller.movePointer(30, 40);
  expect(vi.mocked(runtime.reset)).toHaveBeenCalledOnce();
  expect(vi.mocked(runtime.movePointer)).toHaveBeenCalledExactlyOnceWith(10, 20);
  expect(vi.mocked(runtime.destroy)).not.toHaveBeenCalled();
});

it('does not detach a new runtime when an older attachment is cleaned up', () => {
  const { runtime, controller } = setup();
  const replacement = setup().runtime;
  const detachOld = controller.attach(runtime);
  controller.attach(replacement);
  detachOld();
  controller.reset();
  expect(vi.mocked(runtime.reset)).not.toHaveBeenCalled();
  expect(vi.mocked(replacement.reset)).toHaveBeenCalledOnce();
});
