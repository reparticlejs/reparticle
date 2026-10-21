import { useRef, useState } from 'react';

import { createDemo } from './create-demo';
import { useMountEffect } from './hooks/use-mount-effect';

type DemoController = Awaited<ReturnType<typeof createDemo>>;

export function Demo({
  multiple,
  onSelect,
}: {
  multiple: boolean;
  onSelect: (multiple: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<DemoController>(undefined);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState('');

  useMountEffect(() => {
    const abort = new AbortController();
    let demo: DemoController;

    async function mount() {
      try {
        demo = await createDemo(host.current!, multiple, abort.signal);
        if (abort.signal.aborted) {
          demo?.destroy();
          return;
        }
        controller.current = demo;
        setReady(true);
      } catch (cause) {
        if (!abort.signal.aborted) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      }
    }

    void mount();
    return () => {
      abort.abort();
      controller.current = undefined;
      demo?.destroy();
    };
  });

  function togglePlayback() {
    controller.current?.setPaused(!paused);
    setPaused(!paused);
  }

  function restart() {
    controller.current?.restart();
    setPaused(false);
  }

  return (
    <main>
      <div className="demo" ref={host}>
        {error && <p role="alert">{error}</p>}
      </div>
      <aside className="sidebar">
        <label htmlFor="effect">Effect</label>
        <select
          id="effect"
          value={multiple ? 'multiple' : 'fountain'}
          onChange={(event) => onSelect(event.target.value === 'multiple')}
        >
          <option value="fountain">Star fountain</option>
          <option value="multiple">Multi-emitter</option>
        </select>
        <div className="playback-actions">
          <button disabled={!ready} onClick={togglePlayback}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button disabled={!ready} onClick={restart}>
            Restart
          </button>
        </div>
      </aside>
    </main>
  );
}
