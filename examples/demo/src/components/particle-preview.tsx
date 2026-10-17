import type { PointerEvent } from 'react';

import { usePreviewRenderer } from '../hooks/use-preview-renderer';
import type { ParticlePreviewProps } from '../types/controls';

export function ParticlePreview({ controller }: ParticlePreviewProps) {
  const host = usePreviewRenderer(controller);

  function moveEmitter(event: PointerEvent<HTMLDivElement>) {
    controller.movePointer(event.clientX, event.clientY);
  }

  function centerEmitter(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    controller.movePointer(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  }

  return (
    <div id="preview" ref={host} onPointerMove={moveEmitter} onPointerLeave={centerEmitter}>
      <div className="hint">Move the pointer to position the emitter</div>
    </div>
  );
}
