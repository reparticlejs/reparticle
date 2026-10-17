import type { ControlSectionProps } from '../types/controls';
import { textureOptions } from './emitter-control-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function AppearanceControls({ controls, onChange }: ControlSectionProps) {
  return (
    <fieldset>
      <legend>Appearance</legend>
      <SelectField
        id="texture"
        label="Particle texture"
        value={controls.texture}
        options={textureOptions}
        onChange={(texture) => onChange({ texture })}
      />
      <Slider
        id="size"
        label="Size"
        value={controls.size}
        min={4}
        max={64}
        unit=" px"
        onChange={(size) => onChange({ size })}
      />
    </fieldset>
  );
}
