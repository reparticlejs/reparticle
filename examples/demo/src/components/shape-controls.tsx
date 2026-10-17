import type { ControlSectionProps } from '../types/controls';
import { shapeOptions } from './emitter-control-options';
import { SelectField } from './select-field';
import { Slider } from './slider';

export function ShapeControls({ controls, onChange }: ControlSectionProps) {
  return (
    <>
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
      {controls.shape === 'box' && (
        <>
          <Slider
            id="width"
            label="Width"
            value={controls.width}
            min={0}
            max={400}
            unit=" px"
            onChange={(width) => onChange({ width })}
          />
          <Slider
            id="height"
            label="Height"
            value={controls.height}
            min={0}
            max={400}
            unit=" px"
            onChange={(height) => onChange({ height })}
          />
        </>
      )}
    </>
  );
}
