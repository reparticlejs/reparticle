import type { ControlSectionProps } from '../types/controls';
import { rateCurveOptions } from './rate-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';
import { stretchCurveOptions } from './stretch-curve-options';

export function StretchAxisControls({
  axis,
  controls,
  onChange,
}: ControlSectionProps & { axis: 'X' | 'Y' }) {
  const valueKey = `stretch${axis}` as const;
  const spreadKey = `stretch${axis}Spread` as const;
  const initialCurveKey = `initialStretch${axis}Curve` as const;
  const lifetimeCurveKey = `stretch${axis}Curve` as const;
  return (
    <>
      <SelectField
        id={`initial-stretch-${axis}-curve`}
        label={`Initial stretch ${axis} over emitter lifetime`}
        value={controls[initialCurveKey]}
        options={rateCurveOptions}
        onChange={(value) => onChange({ [initialCurveKey]: value })}
      />
      {controls[initialCurveKey] !== 'effect' && (
        <Slider
          id={`stretch-${axis}`}
          label={`Initial stretch ${axis}`}
          value={controls[valueKey]}
          min={-2}
          max={3}
          step={0.1}
          onChange={(value) => onChange({ [valueKey]: value })}
        />
      )}
      <Slider
        id={`stretch-${axis}-spread`}
        label={`Stretch ${axis} spread ±`}
        value={controls[spreadKey]}
        min={0}
        max={3}
        step={0.1}
        onChange={(value) => onChange({ [spreadKey]: value })}
      />
      <SelectField
        id={`stretch-${axis}-curve`}
        label={`Stretch ${axis} over particle lifetime`}
        value={controls[lifetimeCurveKey]}
        options={stretchCurveOptions}
        onChange={(value) => onChange({ [lifetimeCurveKey]: value })}
      />
    </>
  );
}
