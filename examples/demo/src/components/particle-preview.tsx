import { useEmitterDrag } from '../hooks/use-emitter-drag';
import { usePreviewRenderer } from '../hooks/use-preview-renderer';
import type { ParticlePreviewProps } from '../types/controls';

export function ParticlePreview({ controller }: ParticlePreviewProps) {
  const host = usePreviewRenderer(controller);
  const { startDrag, moveEmitter, endDrag } = useEmitterDrag(controller.movePointer);

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
