import { useRef, useState } from 'react';

import { examples } from '../examples';
import { createPixiApp } from '../runtime/pixi-app';
import type { Example } from '../types/example';
import type { ExamplePlayer } from '../types/example-player';
import type { ExamplePlayerState } from '../types/example-player-state';
import type { ExampleUpdate } from '../types/example-update';
import { useMountEffect } from './use-mount-effect';

/** Own the Pixi player in refs; React state describes only what the UI displays. */
export function useExamplePlayer(initialExample: Example = examples[0]!) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<ExamplePlayer | undefined>(undefined);
  const mountSignal = useRef<AbortSignal | undefined>(undefined);
  const [state, setState] = useState<ExamplePlayerState>({
    example: initialExample,
    paused: false,
    loading: true,
    error: '',
  });

  async function select(selected: Example) {
    const signal = mountSignal.current;
    if (!player.current || !signal || signal.aborted) {
      return;
    }
    setState({
      example: selected,
      paused: false,
      loading: true,
      error: '',
    });

    try {
      const loaded = await player.current.select(selected);
      // Cancelled loads and results from a previous mount cannot change the UI.
      if (loaded && !signal.aborted) {
        setState((previous) => ({ ...previous, loading: false }));
      }
    } catch (cause) {
      if (!signal.aborted) {
        showError(cause);
      }
    }
  }

  /** Keep playback, motion, and pause state while updating the displayed definition. */
  async function update(selected: Example, change: ExampleUpdate) {
    const signal = mountSignal.current;
    if (!player.current || !signal || signal.aborted) {
      return;
    }
    try {
      const applied = await player.current.update(selected, change);
      if (applied && !signal.aborted) {
        setState((previous) => ({ ...previous, example: selected, error: '' }));
      }
    } catch (cause) {
      if (!signal.aborted) {
        showError(cause);
      }
    }
  }

  function showError(cause: unknown) {
    const error = cause instanceof Error ? cause.message : String(cause);
    setState((previous) => ({ ...previous, loading: false, error }));
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
        await select(state.example);
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
    if (!player.current || state.loading || state.error) {
      return;
    }
    const paused = !state.paused;
    player.current.setPaused(paused);
    setState((previous) => ({ ...previous, paused }));
  }

  function restart() {
    if (!player.current || state.loading || state.error) {
      return;
    }
    player.current.restart();
    setState((previous) => ({ ...previous, paused: false }));
  }

  return { host, ...state, select, update, togglePlayback, restart };
}
