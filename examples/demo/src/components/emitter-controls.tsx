import type { EmitterControlsProps, SliderProps } from '../types/controls';
import type { ParticleTextureName } from '../types/preview';

function Slider({ id, label, value, min, max, step = 1, unit = '', onChange }: SliderProps) {
  return (
    <label htmlFor={id}>
      {label}{' '}
      <output id={`${id}-value`}>
        {value}
        {unit}
      </output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </label>
  );
}

export function EmitterControls({ controls, disabled, onChange, onReset }: EmitterControlsProps) {
  return (
    <aside>
      <h2>Emitter</h2>
      <fieldset disabled={disabled}>
        <label htmlFor="capacity">
          Capacity
          <select
            id="capacity"
            value={controls.capacity}
            onChange={(event) => onChange({ capacity: Number(event.currentTarget.value) })}
          >
            <option value={8192}>8,192 slots</option>
            <option value={100000}>100,000 slots</option>
          </select>
        </label>
        <label htmlFor="texture">
          Particle texture
          <select
            id="texture"
            value={controls.texture}
            onChange={(event) =>
              onChange({ texture: event.currentTarget.value as ParticleTextureName })
            }
          >
            <option value="star">Gold star</option>
            <option value="leaf">Leaf</option>
            <option value="spark">Blue spark</option>
            <option value="procedural">Soft circle (procedural)</option>
          </select>
        </label>
        <Slider
          id="size"
          label="Size"
          value={controls.size}
          min={4}
          max={64}
          unit=" px"
          onChange={(size) => onChange({ size })}
        />
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
        <button id="pause" onClick={() => onChange({ paused: !controls.paused })}>
          {controls.paused ? 'Resume' : 'Pause'}
        </button>
        <button id="reset" onClick={onReset}>
          Reset
        </button>
      </fieldset>
      <p>
        <strong id="count">{controls.capacity.toLocaleString()}</strong> GPU particle slots
      </p>
      <small>
        core → GPU.js simulation
        <br />
        pixi → visual output
      </small>
    </aside>
  );
}
