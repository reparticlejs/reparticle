import type { PointerEvent } from 'react';

import type { ParticlePreviewProps } from '../types/controls';

export function ParticlePreview({ hostRef, onPointerMove }: ParticlePreviewProps) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    onPointerMove(event.clientX, event.clientY);
  }

  return (
    <div id="preview" ref={hostRef} onPointerMove={handlePointerMove}>
      <div className="hint">Move the pointer to position the emitter</div>
    </div>
  );
}
