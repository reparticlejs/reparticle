import { useRef, useState } from 'react';

import { createPixiApp } from '../runtime/pixi-app';
import type { Example } from '../types/example';
import type { PixiAppControls } from '../types/pixi-app-controls';
import { useMountEffect } from './use-mount-effect';

/** Create one Pixi application and expose loading state for its selected example. */
export function usePixiApp(initialExample: Example) {
  const host = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<PixiAppControls>();
  const [exampleReady, setExampleReady] = useState(false);
  const [error, setError] = useState('');
  const latestSelection = useRef(0);

  async function selectExample(app: PixiAppControls, example: Example) {
    const selectionId = ++latestSelection.current;
    setExampleReady(false);
    setError('');

    try {
      const loaded = await app.select(example);
      // A newer selection or unmount makes this result irrelevant to the UI.
      if (selectionId !== latestSelection.current) {
        return;
      }
      setExampleReady(loaded);
    } catch (cause) {
      if (selectionId !== latestSelection.current) {
        return;
      }
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  useMountEffect(() => {
    const container = host.current;
    if (!container) {
      return undefined;
    }

    const lifetime = new AbortController();
    let app: PixiAppControls | undefined;

    async function start(mountHost: HTMLDivElement) {
      try {
        app = await createPixiApp(mountHost, lifetime.signal);
        // Unmount can happen between application creation and this continuation.
        if (lifetime.signal.aborted) {
          app?.destroy();
          return;
        }
        if (!app) {
          return;
        }
        setInstance(app);
        await selectExample(app, initialExample);
      } catch (cause) {
        if (!lifetime.signal.aborted) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      }
    }

    void start(container);

    return () => {
      // Invalidate pending UI updates before releasing the application.
      latestSelection.current++;
      lifetime.abort();
      app?.destroy();
    };
  });

  function select(example: Example) {
    if (!instance) {
      return;
    }
    void selectExample(instance, example);
  }

  return { host, instance, exampleReady, error, select };
}
