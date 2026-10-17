import { EmitterControls } from './components/emitter-controls';
import { ParticlePreview } from './components/particle-preview';
import { PreviewStatus } from './components/preview-status';
import { useParticlePreview } from './hooks/use-particle-preview';

export function App() {
  const { host, controls, ready, error, update, reset, movePointer } = useParticlePreview();

  return (
    <main>
      <header>
        <h1>Reparticle demo</h1>
        <p>GPU particle simulation with PixiJS rendering.</p>
      </header>

      <section className="workspace">
        <ParticlePreview hostRef={host} onPointerMove={movePointer} />

        {controls && (
          <EmitterControls
            controls={controls}
            disabled={!ready}
            onChange={update}
            onReset={reset}
          />
        )}
      </section>

      <PreviewStatus controls={controls} ready={ready} error={error} onChange={update} />
    </main>
  );
}
