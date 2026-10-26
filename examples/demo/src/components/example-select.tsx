import { examples } from '@reparticle/examples';
import type { ChangeEvent } from 'react';

import type { ExampleSelectProps } from '../types/example-select-props';

export function ExampleSelect({ example, disabled, onSelect }: ExampleSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = examples.find((item) => item.id === event.currentTarget.value);
    if (selected) {
      onSelect(selected);
    }
  }

  return (
    <>
      <label htmlFor="effect">Effect</label>
      <select id="effect" value={example.id} onChange={handleChange} disabled={disabled}>
        {examples.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </>
  );
}
