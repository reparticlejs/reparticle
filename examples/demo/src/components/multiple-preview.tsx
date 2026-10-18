import { useRef, useState } from 'react';

import { useMountEffect } from '../hooks/use-mount-effect';
import { createMultiplePreview } from '../preview/create-multiple-preview';

export function MultiplePreview() {
  const host = useRef<HTMLDivElement>(null);
  const preview = useRef<Awaited<ReturnType<typeof createMultiplePreview>>>(null);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  useMountEffect(() => {
    const controller = new AbortController();
    void createMultiplePreview(host.current!, controller.signal)
      .then((created) => {
        if (controller.signal.aborted) {
          created?.destroy();
        } else {
          preview.current = created;
          setReady(created !== null);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      });
    return () => {
      controller.abort();
      preview.current?.destroy();
      preview.current = null;
    };
  });

  function togglePause() {
    preview.current?.pause(!paused);
    setPaused(!paused);
  }

  return (
    <main aria-label="Multiple emitters demo">
      <section className="workspace">
        <div id="preview" ref={host} />
        <aside>
          <h2>One effect, three emitters</h2>
          <p>
            Fire loops continuously. Smoke starts after 0.3 seconds. Sparks emit once after 0.15
            seconds.
          </p>
          <p>
            Each emitter has its own timing, capacity, color, and blend mode. Shared wind pushes all
            three to the left.
          </p>
          <button disabled={!ready} onClick={togglePause}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button disabled={!ready} onClick={() => preview.current?.reset()}>
            Restart all emitters
          </button>
          <p>
            <a href={import.meta.env.BASE_URL}>Single-emitter controls</a>
          </p>
          {error && <p role="alert">{error}</p>}
        </aside>
      </section>
    </main>
  );
}
