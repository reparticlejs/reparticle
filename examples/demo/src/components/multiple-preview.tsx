import type { EmitterState } from '@reparticle/core';
import { useRef, useState } from 'react';

import { useMountEffect } from '../hooks/use-mount-effect';
import { createMultiplePreview } from '../preview/create-multiple-preview';
import { Slider } from './slider';

export function MultiplePreview() {
  const host = useRef<HTMLDivElement>(null);
  const preview = useRef<Awaited<ReturnType<typeof createMultiplePreview>>>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, rotation: 0, scale: 1 });
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState<Record<string, EmitterState>>({});
  const [ready, setReady] = useState(false);
  useMountEffect(() => {
    const controller = new AbortController();
    void createMultiplePreview(host.current!, controller.signal, ({ emitterId, state }) => {
      if (!controller.signal.aborted) {
        setStates((current) => ({ ...current, [emitterId]: state }));
      }
    })
      .then((created) => {
        if (controller.signal.aborted) {
          created?.destroy();
        } else {
          preview.current = created;
          setReady(created !== null);
        }
        return created;
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

  function changeTransform(patch: Partial<typeof transform>) {
    const next = { ...transform, ...patch };
    setTransform(next);
    preview.current?.setTransform(next);
  }

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
          <fieldset disabled={!ready}>
            <legend>Effect transform</legend>
            <Slider
              id="effect-x"
              label="X"
              value={transform.x}
              min={-300}
              max={300}
              onChange={(x) => changeTransform({ x })}
            />
            <Slider
              id="effect-y"
              label="Y"
              value={transform.y}
              min={-200}
              max={200}
              onChange={(y) => changeTransform({ y })}
            />
            <Slider
              id="effect-rotation"
              label="Rotation"
              value={transform.rotation}
              min={-180}
              max={180}
              unit="°"
              onChange={(rotation) => changeTransform({ rotation })}
            />
            <Slider
              id="effect-scale"
              label="Scale"
              value={transform.scale}
              min={0}
              max={3}
              step={0.1}
              onChange={(scale) => changeTransform({ scale })}
            />
          </fieldset>
          <button disabled={!ready} onClick={togglePause}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button disabled={!ready} onClick={() => preview.current?.play()}>
            Restart all emitters
          </button>
          <button disabled={!ready} onClick={() => preview.current?.retire()}>
            Finish current loops
          </button>
          <button disabled={!ready} onClick={() => preview.current?.stop()}>
            Stop spawning
          </button>
          <button disabled={!ready} onClick={() => preview.current?.clear()}>
            Stop and clear
          </button>
          <dl aria-label="Emitter states" aria-live="polite">
            {Object.entries(states).map(([id, state]) => (
              <div key={id}>
                <dt>{id}</dt>
                <dd>{state}</dd>
              </div>
            ))}
          </dl>
          <p>
            <a href={import.meta.env.BASE_URL}>Single-emitter controls</a>
          </p>
          {error && <p role="alert">{error}</p>}
        </aside>
      </section>
    </main>
  );
}
