import type { ControlSectionProps } from '../types/controls';
import { capacityOptions, shapeOptions } from './emitter-control-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function EmissionControls({ controls, onChange }: ControlSectionProps) {
  const exceedsCapacity = controls.rate * controls.lifetime > controls.capacity;

  return (
    <fieldset>
      <legend>Emission</legend>
      <SelectField
        id="shape"
        label="Shape"
        value={controls.shape}
        options={shapeOptions}
        onChange={(shape) => onChange({ shape })}
      />
      {controls.shape === 'circle' && (
        <Slider
          id="diameter"
          label="Diameter"
          value={controls.diameter}
          min={0}
          max={400}
          unit=" px"
          onChange={(diameter) => onChange({ diameter })}
        />
      )}
      <SelectField
        id="capacity"
        label="Capacity"
        value={controls.capacity}
        options={capacityOptions}
        onChange={(capacity) => onChange({ capacity })}
      />
      <p id="capacity-note" aria-live="polite">
        {exceedsCapacity
          ? 'Emission × lifetime exceeds capacity: older particles will be replaced early.'
          : 'Switching clears particles. Wait one lifetime before comparing FPS.'}
      </p>
      <p>
        <strong id="count">{controls.capacity.toLocaleString()}</strong> GPU particle slots
      </p>
      <Slider
        id="rate"
        label="Emission"
        value={controls.rate}
        min={0}
        max={50000}
        unit=" / s"
        onChange={(rate) => onChange({ rate })}
      />
      <Slider
        id="gravity"
        label="Gravity"
        value={controls.gravity}
        min={-200}
        max={500}
        onChange={(gravity) => onChange({ gravity })}
      />
      <Slider
        id="lifetime"
        label="Lifetime"
        value={controls.lifetime}
        min={0.2}
        max={5}
        step={0.1}
        unit=" s"
        onChange={(lifetime) => onChange({ lifetime })}
      />
    </fieldset>
  );
}
