import { useRef, useState } from 'react';

import { createPixiApp } from '../runtime/pixi-app';
import type { Example } from '../types/example';
import type { ExamplePlayer } from '../types/example-player';
import type { PixiAppState } from '../types/pixi-app-state';
import { useMountEffect } from './use-mount-effect';

/** Keep one application mounted; selections replace only the effect inside it. */
export function usePixiApp(initialExample: Example) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PixiAppState>({
    player: undefined,
    exampleReady: false,
    error: '',
  });
  const latestSelection = useRef(0);

  async function select(example: Example, player = state.player) {
    if (!player) {
      return;
    }

    const selection = ++latestSelection.current;
    setState({ player, exampleReady: false, error: '' });

    try {
      const exampleReady = await player.select(example);
      if (selection === latestSelection.current) {
        setState({ player, exampleReady, error: '' });
      }
    } catch (cause) {
      if (selection === latestSelection.current) {
        showError(cause, player);
      }
    }
  }

  function showError(cause: unknown, player?: ExamplePlayer) {
    const error = cause instanceof Error ? cause.message : String(cause);
    setState({ player, exampleReady: false, error });
  }

  useMountEffect(() => {
    const container = host.current;
    if (!container) {
      return undefined;
    }

    const lifetime = new AbortController();
    let player: ExamplePlayer | undefined;

    async function start(hostElement: HTMLDivElement) {
      try {
        player = await createPixiApp(hostElement, lifetime.signal);
        if (lifetime.signal.aborted) {
          player?.destroy();
          return;
        }
        await select(initialExample, player);
      } catch (cause) {
        if (!lifetime.signal.aborted) {
          showError(cause);
        }
      }
    }

    void start(container);

    return () => {
      // Ignore pending selection results, including during StrictMode's remount.
      latestSelection.current++;
      lifetime.abort();
      player?.destroy();
    };
  });

  return { host, ...state, select };
}
