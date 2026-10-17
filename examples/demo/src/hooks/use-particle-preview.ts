import { useRef, useState } from 'react';

import { createPreview } from '../preview/create-preview';
import type { ParticlePreview, PreviewControls } from '../types/preview';
import { useMountEffect } from './use-mount-effect';

export function useParticlePreview() {
  const host = useRef<HTMLDivElement>(null);
  const preview = useRef<ParticlePreview | null>(null);
  const [controls, setControls] = useState<PreviewControls | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useMountEffect(() => {
    const controller = new AbortController();
    setReady(false);
    setError('');
    void createPreview(host.current!, controller.signal)
      .then((runtime) => {
        if (controller.signal.aborted) {
          runtime?.destroy();
          return;
        }
        preview.current = runtime;
        setControls(runtime?.controls ?? null);
        setReady(runtime !== null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(`Unable to start the preview: ${String(cause)}`);
        }
      });
    return () => {
      controller.abort();
      preview.current?.destroy();
      preview.current = null;
    };
  });

  function run(action: (runtime: ParticlePreview) => void): void {
    if (!preview.current) {
      return;
    }
    try {
      action(preview.current);
      setError('');
    } catch (cause) {
      setError(String(cause));
    }
  }
  function update(patch: Partial<PreviewControls>): void {
    run((runtime) => {
      setControls(runtime.update(patch));
    });
  }
  return {
    host,
    controls,
    ready,
    error,
    update,
    movePointer: (x: number, y: number) => run((runtime) => runtime.movePointer(x, y)),
    reset: () => run((runtime) => runtime.reset()),
  };
}
