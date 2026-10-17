import type { ChangeEvent } from 'react';

import type { SliderProps } from '../types/controls';

export function Slider({ id, label, value, min, max, step = 1, unit = '', onChange }: SliderProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.currentTarget.valueAsNumber);
  }

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
        onChange={handleChange}
      />
    </label>
  );
}
