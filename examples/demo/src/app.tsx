import { useState } from 'react';

import { EmitterControls } from './components/emitter-controls';
import { ParticlePreview } from './components/particle-preview';
import { PreviewStatus } from './components/preview-status';
import { createPreviewController } from './preview/create-preview-controller';
import type { PreviewControls } from './types/preview';

export function App() {
  const [controls, setControls] = useState<PreviewControls | null>(null);
  const [error, setError] = useState('');
  const [controller] = useState(() =>
    createPreviewController({ onChange: setControls, onError: setError }),
  );
  const ready = controls !== null;

  return (
    <main>
      <header>
        <h1>Reparticle demo</h1>
        <p>GPU particle simulation with PixiJS rendering.</p>
      </header>

      <section className="workspace">
        <ParticlePreview controller={controller} />

        {controls && (
          <EmitterControls
            controls={controls}
            disabled={!ready}
            onChange={controller.update}
            onReset={controller.reset}
          />
        )}
      </section>

      <PreviewStatus controls={controls} ready={ready} error={error} />
    </main>
  );
}
