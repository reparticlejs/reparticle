import { useImperativeHandle, useRef, type PointerEvent } from 'react';

import { useMountEffect } from '../hooks/use-mount-effect';
import { createPreview } from '../preview/create-preview';
import type { ParticlePreviewProps } from '../types/controls';
import type { ParticlePreview as PreviewRuntime } from '../types/preview';

export function ParticlePreview({ ref, onReady, onError }: ParticlePreviewProps) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<PreviewRuntime | null>(null);

  useMountEffect(() => {
    const controller = new AbortController();

    async function start() {
      try {
        const preview = await createPreview(host.current!, controller.signal);
        if (controller.signal.aborted) {
          preview?.destroy();
          return;
        }
        runtime.current = preview;
        if (preview) {
          onReady(preview.controls);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          onError(`Unable to start the preview: ${String(cause)}`);
        }
      }
    }

    void start();
    return () => {
      controller.abort();
      runtime.current?.destroy();
      runtime.current = null;
    };
  });

  useImperativeHandle(
    ref,
    () => ({
      update(patch) {
        try {
          const controls = runtime.current?.update(patch) ?? null;
          onError('');
          return controls;
        } catch (cause) {
          onError(String(cause));
          return null;
        }
      },
      reset() {
        try {
          runtime.current?.reset();
          onError('');
        } catch (cause) {
          onError(String(cause));
        }
      },
    }),
    [onError],
  );

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    runtime.current?.movePointer(event.clientX, event.clientY);
  }

  return (
    <div id="preview" ref={host} onPointerMove={handlePointerMove}>
      <div className="hint">Move the pointer to position the emitter</div>
    </div>
  );
}
