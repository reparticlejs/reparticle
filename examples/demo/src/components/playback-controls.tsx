import type { PlaybackControlsProps } from '../types/controls';

export function PlaybackControls({ paused, disabled, onToggle, onRestart }: PlaybackControlsProps) {
  return (
    <div className="playback-actions">
      <button disabled={disabled} onClick={onToggle}>
        {paused ? 'Resume' : 'Pause'}
      </button>
      <button disabled={disabled} onClick={onRestart}>
        Restart
      </button>
    </div>
  );
}
