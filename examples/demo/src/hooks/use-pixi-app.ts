import { useRef, useState } from 'react';

import { createPixiApp } from '../create-pixi-app';
import type { Example } from '../types/example';
import type { PixiApp } from '../types/pixi-app';
import { useMountEffect } from './use-mount-effect';

/** Keep one application mounted; only the latest selection may update the controls. */
export function usePixiApp(initialExample: Example) {
  const host = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<PixiApp>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const selection = useRef(0);

  async function load(pixiApp: PixiApp, example: Example) {
    const request = ++selection.current;
    setReady(false);
    setError('');
    try {
      const loaded = await pixiApp.select(example);
      if (request === selection.current) {
        setReady(loaded);
      }
    } catch (cause) {
      if (request === selection.current) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    }
  }

  useMountEffect(() => {
    const element = host.current;
    if (!element) {
      return undefined;
    }

    const abort = new AbortController();
    let ownedInstance: PixiApp | undefined;

    async function mount(container: HTMLDivElement) {
      try {
        const pixiApp = await createPixiApp(container, abort.signal);
        if (abort.signal.aborted) {
          pixiApp?.destroy();
          return;
        }
        if (!pixiApp) {
          return;
        }
        ownedInstance = pixiApp;
        setInstance(pixiApp);
        await load(pixiApp, initialExample);
      } catch (cause) {
        if (!abort.signal.aborted) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      }
    }

    void mount(element);
    return () => {
      selection.current++;
      abort.abort();
      ownedInstance?.destroy();
    };
  });

  function select(example: Example) {
    if (instance) {
      void load(instance, example);
    }
  }

  return { host, instance, ready, error, select };
}
