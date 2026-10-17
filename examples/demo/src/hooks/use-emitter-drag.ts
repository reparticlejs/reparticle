import { useRef, type PointerEvent } from 'react';

export function useEmitterDrag(movePointer: (x: number, y: number) => void) {
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
    movePointer(event.clientX, event.clientY);
  }

  function moveEmitter(event: PointerEvent<HTMLDivElement>) {
    if (activePointer.current !== event.pointerId) {
      return;
    }
    movePointer(event.clientX, event.clientY);
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

  return { startDrag, moveEmitter, endDrag };
}
