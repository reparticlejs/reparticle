import type { ControlSectionProps } from '../types/controls';
import { capacityOptions } from './emitter-control-options';
import { initialLifetimeCurveOptions } from './initial-lifetime-curve-options';
import { rateCurveOptions } from './rate-curve-options';
import { SelectField } from './select-field';
import { ShapeControls } from './shape-controls';
import { Slider } from './slider';
import { speedCurveOptions } from './speed-curve-options';

export function EmissionControls({ controls, onChange }: ControlSectionProps) {
  const exceedsCapacity =
    controls.rateCurve !== 'effect' &&
    controls.initialLifetimeCurve !== 'effect' &&
    (controls.rate + controls.rateSpread) * (controls.lifetime + controls.lifetimeSpread) >
      controls.capacity;

  return (
    <fieldset>
      <legend>Emission</legend>
      <ShapeControls controls={controls} onChange={onChange} />
      <SelectField
        id="capacity"
        label="Capacity"
        value={controls.capacity}
        options={capacityOptions}
        onChange={(capacity) => onChange({ capacity })}
      />
      <p id="capacity-note" aria-live="polite">
        {exceedsCapacity
          ? 'Maximum emission × lifetime exceeds capacity: older particles will be replaced early.'
          : 'Switching clears particles. Wait one lifetime before comparing FPS.'}
      </p>
      <p>
        <strong id="count">{controls.capacity.toLocaleString()}</strong> GPU particle slots
      </p>
      <SelectField
        id="rate-curve"
        label="Emission over emitter lifetime"
        value={controls.rateCurve}
        options={rateCurveOptions}
        onChange={(rateCurve) => onChange({ rateCurve })}
      />
      {controls.rateCurve !== 'effect' && (
        <Slider
          id="rate"
          label="Emission"
          value={controls.rate}
          min={0}
          max={50000}
          unit=" / s"
          onChange={(rate) => onChange({ rate })}
        />
      )}
      <Slider
        id="rate-spread"
        label="Emission spread ±"
        value={controls.rateSpread}
        min={0}
        max={50000}
        unit=" / s"
        onChange={(rateSpread) => onChange({ rateSpread })}
      />
      <p>Spread is sampled once per emitter. Changing it restarts the effect.</p>
      <Slider
        id="gravity"
        label="Gravity"
        value={controls.gravity}
        min={-200}
        max={500}
        onChange={(gravity) => onChange({ gravity })}
      />
      <SelectField
        id="initial-lifetime-curve"
        label="Initial lifetime over emitter lifetime"
        value={controls.initialLifetimeCurve}
        options={initialLifetimeCurveOptions}
        onChange={(initialLifetimeCurve) => onChange({ initialLifetimeCurve })}
      />
      {controls.initialLifetimeCurve !== 'effect' && (
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
      )}
      <Slider
        id="lifetime-spread"
        label="Lifetime spread ±"
        value={controls.lifetimeSpread}
        min={0}
        max={5}
        step={0.1}
        unit=" s"
        onChange={(lifetimeSpread) => onChange({ lifetimeSpread })}
      />
      <SelectField
        id="speed-curve"
        label="Initial speed over emitter lifetime"
        value={controls.speedCurve}
        options={speedCurveOptions}
        onChange={(speedCurve) => onChange({ speedCurve })}
      />
      {controls.speedCurve !== 'effect' && (
        <Slider
          id="speed"
          label="Speed"
          value={controls.speed}
          min={0}
          max={1000}
          unit=" px/s"
          onChange={(speed) => onChange({ speed })}
        />
      )}
      <Slider
        id="speed-spread"
        label="Speed spread ±"
        value={controls.speedSpread}
        min={0}
        max={1000}
        unit=" px/s"
        onChange={(speedSpread) => onChange({ speedSpread })}
      />
    </fieldset>
  );
}
