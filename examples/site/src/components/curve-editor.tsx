import { sampleCurve } from '@reparticle/core';
import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';

import type { CurveDrag } from '../types/curve-drag';
import type { CurveEditorProps } from '../types/curve-editor';

/** Stage edits locally so typing never rebuilds the particle simulation. */
export default function CurveEditor({
  curve,
  disabled,
  onApply,
  label,
  clock,
  range,
}: CurveEditorProps) {
  const drag = useRef<CurveDrag | null>(null);
  const [points, setPoints] = useState(curve.points);
  let valid = points.every(
    (point, index) =>
      Number.isFinite(point.time) &&
      Number.isFinite(point.value) &&
      Number.isFinite(point.tangent) &&
      point.time >= 0 &&
      point.time <= 1 &&
      (index === 0 || point.time > points[index - 1].time),
  );
  let samples: number[] = [];
  if (valid) {
    try {
      samples = Array.from(sampleCurve({ points }));
    } catch {
      valid = false;
    }
  }
  const minimum =
    drag.current?.minimum ??
    Math.min(
      range?.[0] ?? 0,
      ...samples,
      ...points.map((point) => point.value).filter(Number.isFinite),
    );
  const maximum =
    drag.current?.maximum ??
    Math.max(
      range?.[1] ?? 1,
      ...samples,
      ...points.map((point) => point.value).filter(Number.isFinite),
    );
  const x = (time: number) => 32 + time * 224;
  const y = (value: number) => 158 - ((value - minimum) / (maximum - minimum)) * 132;
  const line = samples
    .map((value, index) => `${x(index / (samples.length - 1))},${y(value)}`)
    .join(' ');

  // Fixed-length handles remain reachable even when the slope is steep.
  function tangentOffset(tangent: number, side: number) {
    const slope = (-tangent * 132) / (maximum - minimum) / 224;
    const dx = (side * 24) / Math.hypot(1, slope);
    return { x: dx, y: dx * slope };
  }

  function startDrag(event: PointerEvent<SVGCircleElement>, index: number, tangentSide = 0) {
    if (disabled || !valid || event.button !== 0 || drag.current) {
      return;
    }
    const svg = event.currentTarget.ownerSVGElement;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) {
      return;
    }
    event.preventDefault();
    const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    drag.current = {
      pointerId: event.pointerId,
      index,
      tangentSide,
      startX: position.x,
      startY: position.y,
      minimum,
      maximum,
      original: points,
      points,
    };
    svg.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const gesture = drag.current;
    const matrix = event.currentTarget.getScreenCTM();
    if (!gesture || event.pointerId !== gesture.pointerId || !matrix) {
      return;
    }
    const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const point = gesture.original[gesture.index];
    if (Math.hypot(position.x - gesture.startX, position.y - gesture.startY) < 0.5) {
      gesture.points = gesture.original;
      setPoints(gesture.points);
      return;
    }
    if (gesture.tangentSide) {
      const offset = tangentOffset(point.tangent, gesture.tangentSide);
      const dx =
        gesture.tangentSide *
        Math.max(0.01, gesture.tangentSide * (offset.x + position.x - gesture.startX));
      const dy = offset.y + position.y - gesture.startY;
      const tangent = (((-dy / dx) * 224) / 132) * (gesture.maximum - gesture.minimum);
      gesture.points = gesture.original.map((item, index) =>
        index === gesture.index ? { ...item, tangent } : item,
      );
      setPoints(gesture.points);
      return;
    }
    const previous = gesture.original[gesture.index - 1];
    const next = gesture.original[gesture.index + 1];
    // Leave a small gap so a point cannot cross its neighbors or share their time.
    const earliest = previous ? previous.time + (point.time - previous.time) * 0.0001 : 0;
    const latest = next ? next.time - (next.time - point.time) * 0.0001 : 1;
    // Endpoints cover the full lifetime; only interior points can move in time.
    const time =
      gesture.index === 0
        ? 0
        : gesture.index === gesture.original.length - 1
          ? 1
          : Math.max(earliest, Math.min(latest, point.time + (position.x - gesture.startX) / 224));
    const value = Math.max(
      gesture.minimum,
      Math.min(
        gesture.maximum,
        point.value - ((position.y - gesture.startY) / 132) * (gesture.maximum - gesture.minimum),
      ),
    );
    gesture.points = gesture.original.map((item, index) =>
      index === gesture.index ? { ...item, time, value } : item,
    );
    setPoints(gesture.points);
  }

  function finishDrag(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current) {
      addPoint(event);
      return;
    }
    if (drag.current.pointerId !== event.pointerId) {
      return;
    }
    moveDrag(event);
    const gesture = drag.current;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (JSON.stringify(gesture.points) !== JSON.stringify(gesture.original)) {
      onApply({ points: gesture.points });
    }
  }

  function cancelDrag(event: PointerEvent<SVGSVGElement>) {
    if (drag.current?.pointerId !== event.pointerId) {
      return;
    }
    setPoints(drag.current.original);
    drag.current = null;
  }

  function addPoint(event: MouseEvent<SVGSVGElement>) {
    if (disabled || !valid || drag.current || event.button !== 0) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('.curve-handle')) {
      return;
    }
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) {
      return;
    }
    const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (position.x <= 32 || position.x >= 256 || position.y < 26 || position.y > 158) {
      return;
    }
    const time = (position.x - 32) / 224;
    if (points.some((point) => Math.abs(point.time - time) < 0.0001)) {
      return;
    }
    const value = minimum + ((158 - position.y) / 132) * (maximum - minimum);
    const next = [...points, { time, value, tangent: 0 }].sort((a, b) => a.time - b.time);
    setPoints(next);
    onApply({ points: next });
  }

  function removePoint(event: MouseEvent<SVGCircleElement>, index: number) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || !valid || drag.current || index === 0 || index === points.length - 1) {
      return;
    }
    const next = points.filter((_point, at) => at !== index);
    setPoints(next);
    onApply({ points: next });
  }

  return (
    <div className="curve-editor">
      <svg
        viewBox="0 0 280 190"
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        aria-label={`${label} curve`}
      >
        <title>
          {label} over {clock === 'modifier' ? 'emitter duration' : `${clock} lifetime`}
        </title>
        <path d="M32 26V158H256" fill="none" stroke="#56616e" />
        <path d="M32 92H256 M144 26V158" stroke="#29313a" />
        <text x="32" y="178">
          0
        </text>
        <text x="216" y="178">
          1
        </text>
        <text x="2" y="30">
          {Number(maximum.toFixed(2))}
        </text>
        <text x="2" y="158">
          {Number(minimum.toFixed(2))}
        </text>
        <polyline points={line} fill="none" stroke="#c4f58a" strokeWidth="2" />
        {valid &&
          points.map((point, index) => (
            <g key={index}>
              {(index === 0 ? [1] : index === points.length - 1 ? [-1] : [-1, 1]).map((side) => {
                const offset = tangentOffset(point.tangent, side);
                const handleX = x(point.time) + offset.x;
                const handleY = y(point.value) + offset.y;
                return (
                  <g key={side}>
                    <line
                      x1={x(point.time)}
                      y1={y(point.value)}
                      x2={handleX}
                      y2={handleY}
                      stroke="#83b8df"
                      pointerEvents="none"
                    />
                    <circle cx={handleX} cy={handleY} r="4" fill="#83b8df" pointerEvents="none" />
                    <circle
                      className="curve-handle"
                      cx={handleX}
                      cy={handleY}
                      r="9"
                      fill="transparent"
                      onPointerDown={(event) => startDrag(event, index, side)}
                      onContextMenu={(event) => event.preventDefault()}
                    >
                      <title>
                        Drag tangent {index + 1} {side < 0 ? 'left' : 'right'}
                      </title>
                    </circle>
                  </g>
                );
              })}
              <circle
                cx={x(point.time)}
                cy={y(point.value)}
                r="5"
                fill="#c4f58a"
                pointerEvents="none"
              />
              <circle
                className="curve-handle"
                cx={x(point.time)}
                cy={y(point.value)}
                r="13"
                fill="transparent"
                onPointerDown={(event) => startDrag(event, index)}
                onContextMenu={(event) => removePoint(event, index)}
              >
                <title>Drag point {index + 1}</title>
              </circle>
            </g>
          ))}
      </svg>
      <p className="control-note">
        {clock === 'modifier'
          ? 'Time 1 equals the configured emitter duration. Beyond 1, the curve continues along its final slope.'
          : `Time is normalized ${clock} lifetime, from 0 to 1.`}
      </p>
      <details className="value-json">
        <summary>Advanced settings</summary>
        {points.map((point, index) => (
          <fieldset key={index} disabled={disabled}>
            <legend>Point {index + 1}</legend>
            <div className="curve-point">
              {(['time', 'value', 'tangent'] as const).map((field) => (
                <label key={field}>
                  {field === 'time' ? 'Time' : field === 'value' ? 'Value' : 'Tangent'}
                  <input
                    type="number"
                    aria-label={`Point ${index + 1} ${field}`}
                    step="0.05"
                    readOnly={field === 'time' && (index === 0 || index === points.length - 1)}
                    min={field === 'time' ? 0 : undefined}
                    max={field === 'time' ? 1 : undefined}
                    value={Number.isNaN(point[field]) ? '' : point[field]}
                    onChange={(event) =>
                      setPoints(
                        points.map((item, at) =>
                          at === index ? { ...item, [field]: event.target.valueAsNumber } : item,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {!valid && <p role="alert">Use finite values and increasing times between 0 and 1.</p>}
        <div className="control-actions">
          <button type="button" disabled={disabled || !valid} onClick={() => onApply({ points })}>
            Apply curve
          </button>
        </div>
      </details>
      <p className="control-note">
        Click the graph to add a point. Drag to reshape; release to apply. Right-click a middle
        point to remove it. Blue handles adjust the shared tangent. Endpoints move vertically only.
      </p>
    </div>
  );
}
