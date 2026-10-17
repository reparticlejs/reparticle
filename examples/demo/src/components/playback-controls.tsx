import type { EmitterControlsProps } from '../types/controls';
import { playModeOptions } from './emitter-control-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

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
      <SelectField
        id="play-mode"
        label="Play mode"
        value={controls.playMode}
        options={playModeOptions}
        onChange={(playMode) => onChange({ playMode })}
      />
      <Slider
        id="duration"
        label="Duration"
        value={controls.duration}
        min={0}
        max={5}
        step={0.1}
        unit=" s"
        onChange={(duration) => onChange({ duration })}
      />
      <Slider
        id="start-delay"
        label="Start delay"
        value={controls.startDelay}
        min={0}
        max={5}
        step={0.1}
        unit=" s"
        onChange={(startDelay) => onChange({ startDelay })}
      />
      <Slider
        id="start-offset"
        label="Start offset"
        value={controls.startOffset}
        min={0}
        max={5}
        step={0.1}
        unit=" s"
        onChange={(startOffset) => onChange({ startOffset })}
      />
      <p>Start offset prewarms the simulation, capped at particle lifetime.</p>
      <p>
        Changing delay, offset, duration or mode restarts the effect. Once stops emission; existing
        particles finish their lifetime.
      </p>
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
