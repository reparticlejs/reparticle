import type { EmitterControlsProps } from '../types/controls';
import { AppearanceControls } from './appearance-controls';
import { EmissionControls } from './emission-controls';
import { PlaybackControls } from './playback-controls';

export function EmitterControls({ controls, onChange, onReset }: EmitterControlsProps) {
  return (
    <aside>
      <h2>Emitter</h2>
      <EmissionControls controls={controls} onChange={onChange} />
      <AppearanceControls controls={controls} onChange={onChange} />
      <PlaybackControls controls={controls} onChange={onChange} onReset={onReset} />
    </aside>
  );
}
