import type { ChangeEvent } from 'react';

import type { SelectFieldProps } from '../types/controls';

export function SelectField<Value extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<Value>) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = options.find((option) => String(option.value) === event.currentTarget.value);
    if (selected) {
      onChange(selected.value);
    }
  }

  return (
    <label htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={handleChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
