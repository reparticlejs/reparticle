import type { ControlSectionProps } from '../types/controls';
import { shapeOptions } from './emitter-control-options';
import { rateCurveOptions } from './rate-curve-options';
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
      <Slider
        id="emitter-rotation"
        label="Emitter rotation"
        value={controls.emitterRotation}
        min={-180}
        max={180}
        unit="°"
        onChange={(emitterRotation) => onChange({ emitterRotation })}
      />
      {controls.shape === 'circle' && (
        <>
          <SelectField
            id="diameter-curve"
            label="Diameter over emitter lifetime"
            value={controls.diameterCurve}
            options={rateCurveOptions}
            onChange={(diameterCurve) => onChange({ diameterCurve })}
          />
          {controls.diameterCurve !== 'effect' && (
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
          <Slider
            id="diameter-spread"
            label="Diameter spread ±"
            value={controls.diameterSpread}
            min={0}
            max={400}
            unit=" px"
            onChange={(diameterSpread) => onChange({ diameterSpread })}
          />
        </>
      )}
      {(controls.shape === 'box' || controls.shape === 'cone2d') && (
        <>
          <SelectField
            id="width-curve"
            label="Width over emitter lifetime"
            value={controls.widthCurve}
            options={rateCurveOptions}
            onChange={(widthCurve) => onChange({ widthCurve })}
          />
          {controls.widthCurve !== 'effect' && (
            <Slider
              id="width"
              label="Width"
              value={controls.width}
              min={0}
              max={400}
              unit=" px"
              onChange={(width) => onChange({ width })}
            />
          )}
          <Slider
            id="width-spread"
            label="Width spread ±"
            value={controls.widthSpread}
            min={0}
            max={400}
            unit=" px"
            onChange={(widthSpread) => onChange({ widthSpread })}
          />
          <SelectField
            id="height-curve"
            label="Height over emitter lifetime"
            value={controls.heightCurve}
            options={rateCurveOptions}
            onChange={(heightCurve) => onChange({ heightCurve })}
          />
          {controls.heightCurve !== 'effect' && (
            <Slider
              id="height"
              label="Height"
              value={controls.height}
              min={0}
              max={400}
              unit=" px"
              onChange={(height) => onChange({ height })}
            />
          )}
          <Slider
            id="height-spread"
            label="Height spread ±"
            value={controls.heightSpread}
            min={0}
            max={400}
            unit=" px"
            onChange={(heightSpread) => onChange({ heightSpread })}
          />
        </>
      )}
    </>
  );
}
