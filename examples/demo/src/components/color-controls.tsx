import type { ControlSectionProps } from '../types/controls';
import { colorCurveOptions } from './color-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function ColorControls({ controls, onChange }: ControlSectionProps) {
  return (
    <>
      <Slider
        id="red"
        label="Initial red"
        value={controls.red}
        min={0}
        max={1}
        step={0.05}
        onChange={(red) => onChange({ red })}
      />
      <Slider
        id="red-spread"
        label="Red spread ±"
        value={controls.redSpread}
        min={0}
        max={1}
        step={0.05}
        onChange={(redSpread) => onChange({ redSpread })}
      />
      <Slider
        id="green"
        label="Initial green"
        value={controls.green}
        min={0}
        max={1}
        step={0.05}
        onChange={(green) => onChange({ green })}
      />
      <Slider
        id="green-spread"
        label="Green spread ±"
        value={controls.greenSpread}
        min={0}
        max={1}
        step={0.05}
        onChange={(greenSpread) => onChange({ greenSpread })}
      />
      <Slider
        id="blue"
        label="Initial blue"
        value={controls.blue}
        min={0}
        max={1}
        step={0.05}
        onChange={(blue) => onChange({ blue })}
      />
      <Slider
        id="blue-spread"
        label="Blue spread ±"
        value={controls.blueSpread}
        min={0}
        max={1}
        step={0.05}
        onChange={(blueSpread) => onChange({ blueSpread })}
      />
      <SelectField
        id="color-curve"
        label="Color over lifetime"
        value={controls.colorCurve}
        options={colorCurveOptions}
        onChange={(colorCurve) => onChange({ colorCurve })}
      />
    </>
  );
}
