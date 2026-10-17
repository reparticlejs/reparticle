import type { ControlSectionProps } from '../types/controls';
import { rateCurveOptions } from './rate-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function DragControls({ controls, onChange }: ControlSectionProps) {
  return (
    <fieldset>
      <legend>Drag</legend>
      <SelectField
        id="drag-curve"
        label="Magnitude over emitter lifetime"
        value={controls.dragCurve}
        options={rateCurveOptions}
        onChange={(dragCurve) => onChange({ dragCurve })}
      />
      {controls.dragCurve !== 'effect' && (
        <Slider
          id="drag"
          label="Drag magnitude"
          value={controls.drag}
          min={0}
          max={20}
          step={0.1}
          onChange={(drag) => onChange({ drag })}
        />
      )}
      <Slider
        id="drag-spread"
        label="Drag spread ±"
        value={controls.dragSpread}
        min={0}
        max={20}
        step={0.1}
        onChange={(dragSpread) => onChange({ dragSpread })}
      />
      <label>
        <input
          type="checkbox"
          checked={controls.dragDirectional}
          onChange={(event) => onChange({ dragDirectional: event.currentTarget.checked })}
        />
        Directional drag
      </label>
      {controls.dragDirectional && (
        <Slider
          id="drag-rotation"
          label="Drag direction rotation"
          value={controls.dragRotation}
          min={-180}
          max={180}
          unit="°"
          onChange={(dragRotation) => onChange({ dragRotation })}
        />
      )}
    </fieldset>
  );
}
