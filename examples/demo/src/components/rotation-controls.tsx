import type { ControlSectionProps } from '../types/controls';
import { orientationOptions } from './orientation-options';
import { rotationCurveOptions } from './rotation-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function RotationControls({ controls, onChange }: ControlSectionProps) {
  return (
    <>
      <SelectField
        id="orientation"
        label="Orientation"
        value={controls.orientation}
        options={orientationOptions}
        onChange={(orientation) => onChange({ orientation })}
      />
      <Slider
        id="rotation"
        label="Initial rotation"
        value={controls.rotation}
        min={-180}
        max={180}
        step={5}
        unit="°"
        onChange={(rotation) => onChange({ rotation })}
      />
      <SelectField
        id="rotation-curve"
        label="Rotation over lifetime"
        value={controls.rotationCurve}
        options={rotationCurveOptions}
        onChange={(rotationCurve) => onChange({ rotationCurve })}
      />
    </>
  );
}
