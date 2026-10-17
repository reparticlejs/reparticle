import type { ControlSectionProps } from '../types/controls';
import { alphaCurveOptions } from './alpha-curve-options';
import { ColorControls } from './color-controls';
import { textureOptions } from './emitter-control-options';
import { initialColorCurveOptions } from './initial-color-curve-options';
import { initialSizeCurveOptions } from './initial-size-curve-options';
import { RotationControls } from './rotation-controls';
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
      <SelectField
        id="initial-size-curve"
        label="Initial size over emitter lifetime"
        value={controls.initialSizeCurve}
        options={initialSizeCurveOptions}
        onChange={(initialSizeCurve) => onChange({ initialSizeCurve })}
      />
      {controls.initialSizeCurve !== 'effect' && (
        <Slider
          id="size"
          label="Initial size"
          value={controls.size}
          min={0}
          max={64}
          unit=" px"
          onChange={(size) => onChange({ size })}
        />
      )}
      <Slider
        id="size-spread"
        label="Size spread ±"
        value={controls.sizeSpread}
        min={0}
        max={64}
        unit=" px"
        onChange={(sizeSpread) => onChange({ sizeSpread })}
      />
      <SelectField
        id="size-curve"
        label="Size over particle lifetime"
        value={controls.sizeCurve}
        options={sizeCurveOptions}
        onChange={(sizeCurve) => onChange({ sizeCurve })}
      />
      <SelectField
        id="initial-alpha-curve"
        label="Initial alpha over emitter lifetime"
        value={controls.initialAlphaCurve}
        options={initialColorCurveOptions}
        onChange={(initialAlphaCurve) => onChange({ initialAlphaCurve })}
      />
      {controls.initialAlphaCurve !== 'effect' && (
        <Slider
          id="alpha"
          label="Initial alpha"
          value={controls.alpha}
          min={0}
          max={1}
          step={0.05}
          onChange={(alpha) => onChange({ alpha })}
        />
      )}
      <Slider
        id="alpha-spread"
        label="Alpha spread ±"
        value={controls.alphaSpread}
        min={0}
        max={1}
        step={0.05}
        onChange={(alphaSpread) => onChange({ alphaSpread })}
      />
      <SelectField
        id="alpha-curve"
        label="Alpha over particle lifetime"
        value={controls.alphaCurve}
        options={alphaCurveOptions}
        onChange={(alphaCurve) => onChange({ alphaCurve })}
      />
      <RotationControls controls={controls} onChange={onChange} />
      <ColorControls controls={controls} onChange={onChange} />
      <p>
        Initial size, rotation, color and alpha affect new particles. Changing a curve restarts the
        effect.
      </p>
    </fieldset>
  );
}
