import { useExamplePlayer } from '@reparticle/player';
import { useRef, useState, type ReactNode } from 'react';

import type { Property } from '../types/property';
import { propertyExample } from '../utils/property-example';
import { propertyTitle } from '../utils/property-title';
import { propertyUpdate, propertyUpdateNote } from '../utils/property-update';
import CurveControl from './curve-control';

/** Apply supported runtime changes in place; rebuild only authoring-only settings. */
export default function PropertyLab({
  property,
  children,
}: {
  property: Property;
  children?: ReactNode;
}) {
  const pendingSliderValue = useRef<unknown>(undefined);
  const [value, setValue] = useState(property.value);
  const [draft, setDraft] = useState(JSON.stringify(property.value, null, 2));
  const [validationError, setValidationError] = useState('');
  const { host, loading, error, paused, select, update, togglePlayback, restart, example } =
    useExamplePlayer(propertyExample(property, property.value));
  const live = !!propertyUpdate(property.path, example, example);

  function changeSlider(next: unknown, updateLive = live) {
    if (updateLive) {
      apply(next);
      return;
    }
    // Allocation and other construction-only settings wait until the gesture ends.
    pendingSliderValue.current = next;
    setValue(next);
    setDraft(JSON.stringify(next));
    setValidationError('');
  }

  function commitSlider() {
    const next = pendingSliderValue.current;
    pendingSliderValue.current = undefined;
    if (next !== undefined) {
      apply(next);
    }
  }

  function apply(next: unknown) {
    try {
      const selected = propertyExample(property, next);
      setValue(next);
      setDraft(JSON.stringify(next, null, 2));
      setValidationError('');
      if (JSON.stringify(selected) === JSON.stringify(example)) {
        return;
      }
      const change = propertyUpdate(property.path, example, selected);
      if (change) {
        void update(selected, change);
      } else {
        void select(selected);
      }
    } catch (cause) {
      setValidationError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  function applyJson() {
    try {
      apply(JSON.parse(draft));
    } catch {
      setValidationError('Enter valid JSON before applying this value.');
    }
  }

  return (
    <div className="property-lab">
      <div className="preview-column">
        <div className="preview">
          <div className="canvas-host" ref={host}>
            {error && (
              <p className="player-message" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="player-toolbar">
            <span>Live preview</span>
            <div className="playback">
              <button type="button" disabled={loading || !!error} onClick={togglePlayback}>
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button type="button" disabled={loading || !!error} onClick={restart}>
                Restart
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="property-controls">
        <div className="property-controls-heading">
          <h2>Controls</h2>
          <button type="button" disabled={loading} onClick={() => apply(property.value)}>
            Reset
          </button>
        </div>
        {!property.fields && (
          <label htmlFor="property-value">
            {propertyTitle(property)} <span>{property.unit}</span>
          </label>
        )}
        {property.curve && (
          <CurveControl property={property} value={value} disabled={loading} onChange={apply} />
        )}
        {property.fields?.map((field) => {
          const key = field.path.split('.').at(-1)!;
          if (field.visibleWhen && !Reflect.get(Object(value), field.visibleWhen)) {
            return null;
          }
          const current =
            typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;
          return (
            <div className="grouped-property" key={field.path}>
              <label htmlFor={field.path} title={field.description}>
                {propertyTitle(field)}
                <span>{field.unit}</span>
              </label>
              {field.curve && (
                <CurveControl
                  property={field}
                  value={current}
                  disabled={loading}
                  onChange={(next) => apply({ ...Object(value), [key]: next })}
                />
              )}
              {typeof current === 'boolean' && (
                <input
                  id={field.path}
                  type="checkbox"
                  checked={current}
                  disabled={loading}
                  onChange={(event) => apply({ ...Object(value), [key]: event.target.checked })}
                />
              )}
              {field.choices && (
                <select
                  id={field.path}
                  value={String(current)}
                  disabled={loading}
                  onChange={(event) => apply({ ...Object(value), [key]: event.target.value })}
                >
                  {field.choices.map((choice) => (
                    <option key={choice}>{choice}</option>
                  ))}
                </select>
              )}
              {field.range && typeof current === 'number' && (
                <div className="range-control">
                  <input
                    id={field.path}
                    type="range"
                    min={field.range[0]}
                    max={field.range[1]}
                    step={field.range[2]}
                    value={current}
                    disabled={loading}
                    onChange={(event) =>
                      changeSlider(
                        { ...Object(value), [key]: Number(event.target.value) },
                        live && !!propertyUpdate(field.path, example, example),
                      )
                    }
                    onPointerDown={(event) =>
                      event.currentTarget.setPointerCapture(event.pointerId)
                    }
                    onPointerUp={commitSlider}
                    onPointerCancel={commitSlider}
                    onKeyUp={commitSlider}
                    onBlur={commitSlider}
                  />
                  <output>{Number(current.toFixed(3))}</output>
                </div>
              )}
            </div>
          );
        })}
        {property.range && typeof value === 'number' && (
          <div className="range-control">
            <input
              id="property-value"
              type="range"
              min={property.range[0]}
              max={property.range[1]}
              step={property.range[2]}
              value={value}
              disabled={loading}
              onChange={(event) => changeSlider(Number(event.target.value))}
              onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
              onPointerUp={commitSlider}
              onPointerCancel={commitSlider}
              onKeyUp={commitSlider}
              onBlur={commitSlider}
            />
            <output>{Number(value.toFixed(3))}</output>
          </div>
        )}
        {property.choices && (
          <select
            id="property-value"
            value={String(value)}
            disabled={loading}
            onChange={(event) => apply(event.target.value)}
          >
            {property.choices.map((choice) => (
              <option key={choice}>{choice}</option>
            ))}
          </select>
        )}
        {typeof value === 'boolean' && (
          <input
            id="property-value"
            type="checkbox"
            checked={value}
            disabled={loading}
            onChange={(event) => apply(event.target.checked)}
          />
        )}
        {property.group !== 'Curves' && (
          <p className="control-note">
            {propertyUpdateNote(property.path, live)}{' '}
            {(!live || property.fields) &&
              'Settings that require a restart apply when you release the slider. '}
            Slider ranges are for this experiment, not schema limits.
          </p>
        )}
        <details className="value-json">
          <summary>Edit JSON</summary>
          <label htmlFor="property-json">
            Value as JSON <span>Numbers or curves where supported</span>
          </label>
          <textarea
            id="property-json"
            spellCheck={false}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={7}
          />
          <div className="control-actions">
            <button type="button" disabled={loading} onClick={applyJson}>
              Apply JSON
            </button>
          </div>
        </details>
        {validationError && (
          <pre className="validation-error" role="alert">
            {validationError}
          </pre>
        )}
        {property.group === 'Artwork' && (
          <details className="source-panel">
            <summary>
              Artwork settings <span>Separate from effect JSON</span>
            </summary>
            <pre>
              <code>{JSON.stringify(example.artwork, null, 2)}</code>
            </pre>
          </details>
        )}
        <details className="source-panel">
          <summary>
            Effect JSON <span>Validated configuration used by this preview</span>
          </summary>
          <pre>
            <code>{JSON.stringify(example.definition, null, 2)}</code>
          </pre>
        </details>
        {children}
      </div>
    </div>
  );
}
