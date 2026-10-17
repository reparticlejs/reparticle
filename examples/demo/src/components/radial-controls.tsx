import type { ControlSectionProps } from '../types/controls';
import { rateCurveOptions } from './rate-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function RadialControls({ controls, onChange }: ControlSectionProps) {
  return (
    <fieldset>
      <legend>Radial</legend>
      <SelectField
        id="radial-curve"
        label="Magnitude over emitter lifetime"
        value={controls.radialCurve}
        options={rateCurveOptions}
        onChange={(radialCurve) => onChange({ radialCurve })}
      />
      {controls.radialCurve !== 'effect' && (
        <Slider
          id="radial"
          label="Radial magnitude"
          value={controls.radial}
          min={-500}
          max={500}
          unit=" units/s²"
          onChange={(radial) => onChange({ radial })}
        />
      )}
      <Slider
        id="radial-spread"
        label="Radial spread ±"
        value={controls.radialSpread}
        min={0}
        max={500}
        unit=" units/s²"
        onChange={(radialSpread) => onChange({ radialSpread })}
      />
      <Slider
        id="radial-x"
        label="Center X"
        value={controls.radialX}
        min={-500}
        max={500}
        unit=" units"
        onChange={(radialX) => onChange({ radialX })}
      />
      <Slider
        id="radial-y"
        label="Center Y"
        value={controls.radialY}
        min={-500}
        max={500}
        unit=" units"
        onChange={(radialY) => onChange({ radialY })}
      />
      <Slider
        id="radial-distance"
        label="Maximum distance"
        value={controls.radialMaxDistance}
        min={0}
        max={1000}
        unit=" units"
        onChange={(radialMaxDistance) => onChange({ radialMaxDistance })}
      />
      <p>
        Positive repels; negative attracts. The center is relative to the emitter. Strength is
        constant within the maximum distance.
      </p>
    </fieldset>
  );
}
