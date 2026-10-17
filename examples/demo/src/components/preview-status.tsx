import type { PreviewStatusProps } from '../types/controls';

export function PreviewStatus({ controls, ready, error }: PreviewStatusProps) {
  let status = 'Starting GPU simulation…';
  if (ready) {
    status = 'GPU.js · WebGL2 · direct GPU rendering';
  }
  if (error) {
    status = 'Preview unavailable';
  }

  let capacityNote = 'Switching clears particles. Wait one lifetime before comparing FPS.';
  if (controls && controls.rate * controls.lifetime > controls.capacity) {
    capacityNote = 'Emission × lifetime exceeds capacity: older particles will be replaced early.';
  }

  return (
    <>
      {controls && (
        <p id="capacity-note" aria-live="polite">
          {capacityNote}
        </p>
      )}

      <output id="status">{status}</output>

      {error && (
        <p id="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
