import { useRef } from 'react';

import { createPreview } from '../preview/create-preview';
import type { ParticlePreview } from '../types/preview';
import type { PreviewController } from '../types/preview-controller';
import { useMountEffect } from './use-mount-effect';

export function usePreviewRenderer(controller: PreviewController) {
  const host = useRef<HTMLDivElement>(null);

  useMountEffect(() => {
    const abort = new AbortController();
    let instance: ParticlePreview | null = null;
    let detach: (() => void) | undefined;

    async function mount() {
      try {
        instance = await createPreview(host.current!, abort.signal);
        if (abort.signal.aborted) {
          instance?.destroy();
          return;
        }
        if (instance) {
          detach = controller.attach(instance);
        }
      } catch (cause) {
        if (!abort.signal.aborted) {
          controller.reportError(`Unable to start the preview: ${String(cause)}`);
        }
      }
    }

    void mount();
    return () => {
      abort.abort();
      detach?.();
      instance?.destroy();
    };
  });

  return host;
}
