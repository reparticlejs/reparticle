import { useRef, type PointerEvent } from 'react';

import { usePreviewRenderer } from '../hooks/use-preview-renderer';
import type { ParticlePreviewProps } from '../types/controls';

export function ParticlePreview({ controller }: ParticlePreviewProps) {
  const host = usePreviewRenderer(controller);
  const activePointer = useRef<number | null>(null);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || activePointer.current !== null) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('.replayable-stats')) {
      return;
    }
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    controller.movePointer(event.clientX, event.clientY);
  }

  function moveEmitter(event: PointerEvent<HTMLDivElement>) {
    if (activePointer.current !== event.pointerId) {
      return;
    }
    controller.movePointer(event.clientX, event.clientY);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (activePointer.current !== event.pointerId) {
      return;
    }
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      id="preview"
      ref={host}
      onPointerDown={startDrag}
      onPointerMove={moveEmitter}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
    >
      <div className="hint">Press and drag to move the emitter</div>
    </div>
  );
}
