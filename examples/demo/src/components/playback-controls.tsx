import type { EmitterControlsProps } from '../types/controls';

export function PlaybackControls({ controls, onChange, onReset }: EmitterControlsProps) {
  function togglePlayback() {
    onChange({ paused: !controls.paused });
  }

  function toggleStats() {
    onChange({ statsVisible: !controls.statsVisible });
  }

  return (
    <fieldset>
      <legend>Playback</legend>
      <div className="playback-actions">
        <button id="pause" onClick={togglePlayback}>
          {controls.paused ? 'Resume' : 'Pause'}
        </button>
        <button id="stats-toggle" onClick={toggleStats}>
          {controls.statsVisible ? 'Hide stats' : 'Show stats'}
        </button>
        <button id="reset" onClick={onReset}>
          Reset
        </button>
      </div>
    </fieldset>
  );
}
