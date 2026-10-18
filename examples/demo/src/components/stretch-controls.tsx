import type { ControlSectionProps } from '../types/controls';
import { StretchAxisControls } from './stretch-axis-controls';

export function StretchControls(props: ControlSectionProps) {
  return (
    <fieldset>
      <legend>Stretch</legend>
      <label>
        <input
          type="checkbox"
          checked={props.controls.stretchWithVelocity}
          onChange={(event) => props.onChange({ stretchWithVelocity: event.currentTarget.checked })}
        />
        Stretch with velocity
      </label>
      {props.controls.stretchWithVelocity && (
        <p>Y stretch follows speed. Use Movement direction orientation to align it with motion.</p>
      )}
      <StretchAxisControls axis="X" {...props} />
      <StretchAxisControls axis="Y" {...props} />
      <p>
        {props.controls.stretchWithVelocity
          ? 'Birth and lifetime stretch add together. Y stretch is multiplied by speed / 120; at rest, Y returns to its unstretched size. X stretch stays unchanged.'
          : 'Birth and lifetime stretch add together: 0 keeps the size, 1 doubles it, −1 collapses it. Lower values flip that axis.'}
      </p>
    </fieldset>
  );
}
