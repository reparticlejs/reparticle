import type { ControlSectionProps } from '../types/controls';
import { rateCurveOptions } from './rate-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function VortexControls({ controls, onChange }: ControlSectionProps) {
  return (
    <fieldset>
      <legend>Vortex</legend>
      <SelectField
        id="vortex-curve"
        label="Magnitude over emitter lifetime"
        value={controls.vortexCurve}
        options={rateCurveOptions}
        onChange={(vortexCurve) => onChange({ vortexCurve })}
      />
      {controls.vortexCurve !== 'effect' && (
        <Slider
          id="vortex"
          label="Vortex magnitude"
          value={controls.vortex}
          min={-500}
          max={500}
          unit=" units/s²"
          onChange={(vortex) => onChange({ vortex })}
        />
      )}
      <Slider
        id="vortex-spread"
        label="Vortex spread ±"
        value={controls.vortexSpread}
        min={0}
        max={500}
        unit=" units/s²"
        onChange={(vortexSpread) => onChange({ vortexSpread })}
      />
      <Slider
        id="vortex-x"
        label="Center X"
        value={controls.vortexX}
        min={-500}
        max={500}
        unit=" units"
        onChange={(vortexX) => onChange({ vortexX })}
      />
      <Slider
        id="vortex-y"
        label="Center Y"
        value={controls.vortexY}
        min={-500}
        max={500}
        unit=" units"
        onChange={(vortexY) => onChange({ vortexY })}
      />
      <Slider
        id="vortex-distance"
        label="Maximum distance"
        value={controls.vortexMaxDistance}
        min={0}
        max={1000}
        unit=" units"
        onChange={(vortexMaxDistance) => onChange({ vortexMaxDistance })}
      />
      <Slider
        id="vortex-rotation"
        label="Center fallback rotation"
        value={controls.vortexRotation}
        min={-180}
        max={180}
        unit="°"
        onChange={(vortexRotation) => onChange({ vortexRotation })}
      />
      <p>
        Positive turns counterclockwise; negative turns clockwise. The center is relative to the
        emitter. Strength is constant within the maximum distance. At the exact center, rotation
        sets the starting direction.
      </p>
    </fieldset>
  );
}
