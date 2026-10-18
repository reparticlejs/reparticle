import type { ControlSectionProps } from '../types/controls';
import { angularVelocityCurveOptions } from './angular-velocity-curve-options';
import { rateCurveOptions } from './rate-curve-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function AngularVelocityControls({ controls, onChange }: ControlSectionProps) {
  return (
    <>
      <SelectField
        id="initial-angular-velocity-curve"
        label="Initial spin over emitter lifetime"
        value={controls.initialAngularVelocityCurve}
        options={rateCurveOptions}
        onChange={(initialAngularVelocityCurve) => onChange({ initialAngularVelocityCurve })}
      />
      {controls.initialAngularVelocityCurve !== 'effect' && (
        <Slider
          id="angular-velocity"
          label="Initial angular velocity"
          value={controls.angularVelocity}
          min={-720}
          max={720}
          step={10}
          unit="°/s"
          onChange={(angularVelocity) => onChange({ angularVelocity })}
        />
      )}
      <Slider
        id="angular-velocity-spread"
        label="Angular velocity spread ±"
        value={controls.angularVelocitySpread}
        min={0}
        max={720}
        step={10}
        unit="°/s"
        onChange={(angularVelocitySpread) => onChange({ angularVelocitySpread })}
      />
      <SelectField
        id="angular-velocity-curve"
        label="Spin multiplier over particle lifetime"
        value={controls.angularVelocityCurve}
        options={angularVelocityCurveOptions}
        onChange={(angularVelocityCurve) => onChange({ angularVelocityCurve })}
      />
      <p>
        Positive spins counterclockwise. Initial spin changes affect new particles. Lifetime
        rotation is ignored in this orientation mode.
      </p>
    </>
  );
}
