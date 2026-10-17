import { afterEach, expect, it, vi } from "vitest";
import { createStatsLifecycle } from "../stats/lifecycle/create-stats-lifecycle";

afterEach(() => vi.unstubAllGlobals());
it("samples host frames only while visible and releases subscriptions on destroy", () => {
  const document = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal("document", document);
  const sample = new Map();
  const sampler = { start: vi.fn(), stop: vi.fn(), reset: vi.fn(), update: vi.fn(() => sample) };
  const view = {
    show: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
    clearHistory: vi.fn(),
    update: vi.fn(),
  };
  let callback: ((timestamp: number) => void) | undefined;
  const release = vi.fn(() => {
    callback = undefined;
  });
  const host = {
    subscribePostRender: vi.fn((listener: (timestamp: number) => void) => {
      callback = listener;
      return release;
    }),
  };
  const stats = createStatsLifecycle(sampler, view, host);
  callback!(1000);
  expect(view.update).toHaveBeenCalledWith(sample);
  stats.hide();
  expect(callback).toBeUndefined();
  expect(sampler.stop).toHaveBeenCalledTimes(1);
  document.hidden = true;
  document.dispatchEvent(new Event("visibilitychange"));
  stats.show();
  expect(callback).toBeUndefined();
  document.hidden = false;
  document.dispatchEvent(new Event("visibilitychange"));
  expect(callback).toBeTypeOf("function");
  stats.destroy();
  stats.destroy();
  stats.show();
  expect(callback).toBeUndefined();
  expect(view.destroy).toHaveBeenCalledTimes(1);
  expect(host.subscribePostRender).toHaveBeenCalledTimes(2);
});
