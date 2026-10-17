import type { ControlSectionProps } from '../types/controls';
import { initialRotationCurveOptions } from './initial-rotation-curve-options';
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
      <SelectField
        id="initial-rotation-curve"
        label="Initial rotation over emitter lifetime"
        value={controls.initialRotationCurve}
        options={initialRotationCurveOptions}
        onChange={(initialRotationCurve) => onChange({ initialRotationCurve })}
      />
      {controls.initialRotationCurve !== 'effect' && (
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
      )}
      <Slider
        id="rotation-spread"
        label="Rotation spread ±"
        value={controls.rotationSpread}
        min={0}
        max={360}
        unit="°"
        onChange={(rotationSpread) => onChange({ rotationSpread })}
      />
      <SelectField
        id="rotation-curve"
        label="Rotation over particle lifetime"
        value={controls.rotationCurve}
        options={rotationCurveOptions}
        onChange={(rotationCurve) => onChange({ rotationCurve })}
      />
    </>
  );
}
