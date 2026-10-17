import type { PreviewStatusProps } from '../types/controls';

export function PreviewStatus({ ready, error }: PreviewStatusProps) {
  let status = 'Starting GPU simulation…';
  if (ready) {
    status = 'GPU.js · WebGL2 · direct GPU rendering';
  }
  if (error) {
    status = 'Preview unavailable';
  }

  return (
    <>
      <output id="status">{status}</output>

      {error && (
        <p id="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
