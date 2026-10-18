import type { ParticleTint } from '@reparticle/pixi';
import { useState } from 'react';

import type { EmitterTintControlsProps } from '../types/controls';
import { Slider } from './slider';

const white = { red: 1, green: 1, blue: 1, alpha: 1 };

export function EmitterTintControls({ disabled, onChange, onReset }: EmitterTintControlsProps) {
  const [tint, setTint] = useState<ParticleTint>(white);

  function change(patch: Partial<ParticleTint>) {
    const next = { ...tint, ...patch };
    setTint(next);
    onChange(next);
  }

  function reset() {
    setTint(white);
    onReset();
  }

  return (
    <fieldset disabled={disabled}>
      <legend>Fire tint</legend>
      <p>
        Changes living fire particles immediately, including while paused. Smoke and sparks keep
        their own colors.
      </p>
      <Slider
        id="fire-red"
        label="Red"
        min={0}
        max={1}
        step={0.01}
        value={tint.red}
        onChange={(red) => change({ red })}
      />
      <Slider
        id="fire-green"
        label="Green"
        min={0}
        max={1}
        step={0.01}
        value={tint.green}
        onChange={(green) => change({ green })}
      />
      <Slider
        id="fire-blue"
        label="Blue"
        min={0}
        max={1}
        step={0.01}
        value={tint.blue}
        onChange={(blue) => change({ blue })}
      />
      <Slider
        id="fire-alpha"
        label="Alpha"
        min={0}
        max={1}
        step={0.01}
        value={tint.alpha}
        onChange={(alpha) => change({ alpha })}
      />
      <button onClick={reset}>Reset fire tint</button>
    </fieldset>
  );
}
