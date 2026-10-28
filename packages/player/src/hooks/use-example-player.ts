import { useRef, useState } from 'react';

import { createPixiApp } from '../runtime/pixi-app';
import type { Example } from '../types/example';
import type { ExamplePlayer } from '../types/example-player';
import type { ExamplePlayerState } from '../types/example-player-state';
import type { ExampleUpdate } from '../types/example-update';
import type { PlayerBackend } from '../types/player-backend';
import { useMountEffect } from './use-mount-effect';

/** Own the Pixi player in refs; React state describes only what the UI displays. */
export function useExamplePlayer(initialExample: Example) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<ExamplePlayer | undefined>(undefined);
  const lifetime = useRef<AbortController | undefined>(undefined);
  const [backend, setBackend] = useState<PlayerBackend>('auto');
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

  /** Release the previous renderer before creating another on the same host. */
  function dispose() {
    lifetime.current?.abort();
    const current = player.current;
    player.current = undefined;
    current?.destroy();
  }

  async function start(selectedBackend: PlayerBackend, selected: Example) {
    dispose();
    const container = host.current;
    if (!container) {
      return;
    }
    const controller = new AbortController();
    lifetime.current = controller;
    mountSignal.current = controller.signal;
    setState({ example: selected, paused: false, loading: true, error: '' });
    try {
      const created = await createPixiApp(container, controller.signal, selectedBackend);
      if (controller.signal.aborted) {
        created?.destroy();
        return;
      }
      player.current = created;
      await select(selected);
    } catch (cause) {
      if (!controller.signal.aborted) {
        showError(cause);
      }
    }
  }

  useMountEffect(() => {
    void start('auto', initialExample);
    return dispose;
  });

  function selectBackend(selected: PlayerBackend) {
    if (selected === backend) {
      return;
    }
    setBackend(selected);
    void start(selected, state.example);
  }

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

  return { host, ...state, backend, selectBackend, select, update, togglePlayback, restart };
}
