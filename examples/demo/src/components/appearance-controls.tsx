import type { ControlSectionProps } from '../types/controls';
import { textureOptions } from './emitter-control-options';
import { SelectField } from './select-field';
import { sizeCurveOptions } from './size-curve-options';
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
        label="Initial size"
        value={controls.size}
        min={0}
        max={64}
        unit=" px"
        onChange={(size) => onChange({ size })}
      />
      <SelectField
        id="size-curve"
        label="Size over lifetime"
        value={controls.sizeCurve}
        options={sizeCurveOptions}
        onChange={(sizeCurve) => onChange({ sizeCurve })}
      />
      <p>Initial size affects new particles. Changing the curve restarts the effect.</p>
    </fieldset>
  );
}
