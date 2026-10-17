import type { ControlSectionProps } from '../types/controls';
import { colorCurveOptions } from './color-curve-options';
import { initialColorCurveOptions } from './initial-color-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function ColorControls({ controls, onChange }: ControlSectionProps) {
  return (
    <>
      <SelectField
        id="initial-red-curve"
        label="Initial red over emitter lifetime"
        value={controls.initialRedCurve}
        options={initialColorCurveOptions}
        onChange={(initialRedCurve) => onChange({ initialRedCurve })}
      />
      {controls.initialRedCurve !== 'effect' && (
        <Slider
          id="red"
          label="Initial red"
          value={controls.red}
          min={0}
          max={1}
          step={0.05}
          onChange={(red) => onChange({ red })}
        />
      )}
      <Slider
        id="red-spread"
        label="Red spread ±"
        value={controls.redSpread}
        min={0}
        max={1}
        step={0.05}
        onChange={(redSpread) => onChange({ redSpread })}
      />
      <SelectField
        id="initial-green-curve"
        label="Initial green over emitter lifetime"
        value={controls.initialGreenCurve}
        options={initialColorCurveOptions}
        onChange={(initialGreenCurve) => onChange({ initialGreenCurve })}
      />
      {controls.initialGreenCurve !== 'effect' && (
        <Slider
          id="green"
          label="Initial green"
          value={controls.green}
          min={0}
          max={1}
          step={0.05}
          onChange={(green) => onChange({ green })}
        />
      )}
      <Slider
        id="green-spread"
        label="Green spread ±"
        value={controls.greenSpread}
        min={0}
        max={1}
        step={0.05}
        onChange={(greenSpread) => onChange({ greenSpread })}
      />
      <SelectField
        id="initial-blue-curve"
        label="Initial blue over emitter lifetime"
        value={controls.initialBlueCurve}
        options={initialColorCurveOptions}
        onChange={(initialBlueCurve) => onChange({ initialBlueCurve })}
      />
      {controls.initialBlueCurve !== 'effect' && (
        <Slider
          id="blue"
          label="Initial blue"
          value={controls.blue}
          min={0}
          max={1}
          step={0.05}
          onChange={(blue) => onChange({ blue })}
        />
      )}
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
        label="Color over particle lifetime"
        value={controls.colorCurve}
        options={colorCurveOptions}
        onChange={(colorCurve) => onChange({ colorCurve })}
      />
    </>
  );
}
