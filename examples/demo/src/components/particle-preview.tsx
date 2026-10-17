import type { PointerEvent } from 'react';

import { usePreviewRenderer } from '../hooks/use-preview-renderer';
import type { ParticlePreviewProps } from '../types/controls';

export function ParticlePreview({ controller }: ParticlePreviewProps) {
  const host = usePreviewRenderer(controller);

  function moveEmitter(event: PointerEvent<HTMLDivElement>) {
    controller.movePointer(event.clientX, event.clientY);
  }

  return (
    <div id="preview" ref={host} onPointerMove={moveEmitter}>
      <div className="hint">Move the pointer to position the emitter</div>
    </div>
  );
}
