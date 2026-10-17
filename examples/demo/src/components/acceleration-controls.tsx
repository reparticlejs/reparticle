import type { ControlSectionProps } from '../types/controls';
import { rateCurveOptions } from './rate-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function AccelerationControls({ controls, onChange }: ControlSectionProps) {
  return (
    <fieldset>
      <legend>Acceleration</legend>
      <SelectField
        id="acceleration-curve"
        label="Magnitude over emitter lifetime"
        value={controls.accelerationCurve}
        options={rateCurveOptions}
        onChange={(accelerationCurve) => onChange({ accelerationCurve })}
      />
      {controls.accelerationCurve !== 'effect' && (
        <Slider
          id="acceleration"
          label="Acceleration magnitude"
          value={controls.acceleration}
          min={-500}
          max={500}
          unit=" units/s²"
          onChange={(acceleration) => onChange({ acceleration })}
        />
      )}
      <Slider
        id="acceleration-spread"
        label="Acceleration spread ±"
        value={controls.accelerationSpread}
        min={0}
        max={500}
        unit=" units/s²"
        onChange={(accelerationSpread) => onChange({ accelerationSpread })}
      />
      <Slider
        id="acceleration-rotation"
        label="Acceleration rotation"
        value={controls.accelerationRotation}
        min={-180}
        max={180}
        unit="°"
        onChange={(accelerationRotation) => onChange({ accelerationRotation })}
      />
      <p>0° points up; 180° points down. Acceleration applies before drag.</p>
    </fieldset>
  );
}
