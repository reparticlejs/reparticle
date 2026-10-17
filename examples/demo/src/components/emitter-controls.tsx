import type { EmitterControlsProps } from '../types/controls';
import { AccelerationControls } from './acceleration-controls';
import { AppearanceControls } from './appearance-controls';
import { DragControls } from './drag-controls';
import { EmissionControls } from './emission-controls';
import { PlaybackControls } from './playback-controls';
import { RadialControls } from './radial-controls';

export function EmitterControls({ controls, onChange, onReset }: EmitterControlsProps) {
  return (
    <aside>
      <h2>Emitter</h2>
      <EmissionControls controls={controls} onChange={onChange} />
      <AccelerationControls controls={controls} onChange={onChange} />
      <DragControls controls={controls} onChange={onChange} />
      <RadialControls controls={controls} onChange={onChange} />
      <AppearanceControls controls={controls} onChange={onChange} />
      <PlaybackControls controls={controls} onChange={onChange} onReset={onReset} />
    </aside>
  );
}
