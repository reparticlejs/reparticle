import { emitterConfigSchema } from '@reparticle/core';
import { CurveEditor } from '@reparticle/player/curve-editor';

import type { CurveControlProps } from '../types/curve-control';

// Reuse the public schema's unconstrained scalar parser, including tangent defaults.
const scalarSchema = emitterConfigSchema.def.shape.initial.def.shape.speed;

/** Keep constant sliders simple; expose the same graph for any curve-capable scalar. */
export default function CurveControl({ property, value, disabled, onChange }: CurveControlProps) {
  const scalar = scalarSchema.parse(value);
  const constant = typeof scalar === 'number';
  const label = property.label ?? property.path.split('.').at(-1)!;
  return (
    <div className="curve-control">
      <select
        aria-label={`${label} mode`}
        value={constant ? 'constant' : 'curve'}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value === 'constant') {
            onChange(typeof scalar === 'number' ? scalar : scalar.points[0].value);
          } else if (typeof scalar === 'number') {
            onChange({
              points: [
                { time: 0, value: scalar, tangent: 0 },
                { time: 1, value: scalar, tangent: 0 },
              ],
            });
          }
        }}
      >
        <option value="constant">Constant</option>
        <option value="curve">Curve</option>
      </select>
      {constant && !property.range && (
        <input
          type="number"
          aria-label={`${label} value`}
          key={scalar}
          defaultValue={scalar}
          disabled={disabled}
          step="0.1"
          onBlur={(event) => {
            if (Number.isFinite(event.target.valueAsNumber)) {
              onChange(event.target.valueAsNumber);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
        />
      )}
      {!constant && (
        <CurveEditor
          key={JSON.stringify(scalar)}
          curve={scalar}
          disabled={disabled}
          label={label}
          clock={property.curve!}
          range={property.range ? [property.range[0], property.range[1]] : undefined}
          onApply={onChange}
        />
      )}
    </div>
  );
}
