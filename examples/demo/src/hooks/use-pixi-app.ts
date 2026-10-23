import { useRef, useState } from 'react';

import { createPixiApp } from '../runtime/pixi-app';
import type { Example } from '../types/example';
import type { ExamplePlayer } from '../types/example-player';
import type { PixiAppState } from '../types/pixi-app-state';
import { useMountEffect } from './use-mount-effect';

/** Own the Pixi player in refs; React state describes only what the UI displays. */
export function usePixiApp(initialExample: Example) {
  const host = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const player = useRef<ExamplePlayer | undefined>(undefined);
  const mountSignal = useRef<AbortSignal | undefined>(undefined);
  const [state, setState] = useState<PixiAppState>({
    appReady: false,
    exampleReady: false,
    error: '',
  });

  async function select(example: Example) {
    const signal = mountSignal.current;
    if (!player.current || !signal || signal.aborted) {
      return;
    }
    setPaused(false);
    setState({ appReady: true, exampleReady: false, error: '' });

    try {
      const exampleReady = await player.current.select(example);
      // Cancelled loads and results from a previous mount cannot change the UI.
      if (exampleReady && !signal.aborted) {
        setState({ appReady: true, exampleReady: true, error: '' });
      }
    } catch (cause) {
      if (!signal.aborted) {
        showError(cause);
      }
    }
  }

  function showError(cause: unknown) {
    const error = cause instanceof Error ? cause.message : String(cause);
    setState({ appReady: !!player.current, exampleReady: false, error });
  }

  useMountEffect(() => {
    const container = host.current;
    if (!container) {
      return undefined;
    }

    const lifetime = new AbortController();
    mountSignal.current = lifetime.signal;

    async function start(hostElement: HTMLDivElement) {
      try {
        const created = await createPixiApp(hostElement, lifetime.signal);
        if (lifetime.signal.aborted) {
          created?.destroy();
          return;
        }
        player.current = created;
        await select(initialExample);
      } catch (cause) {
        if (!lifetime.signal.aborted) {
          showError(cause);
        }
      }
    }

    void start(container);

    return () => {
      lifetime.abort();
      const current = player.current;
      player.current = undefined;
      current?.destroy();
    };
  });

  function togglePlayback() {
    if (!player.current || !state.exampleReady) {
      return;
    }
    player.current.setPaused(!paused);
    setPaused(!paused);
  }

  function restart() {
    player.current?.restart();
    setPaused(false);
  }

  return { host, ...state, paused, select, togglePlayback, restart };
}
