import { useRef, useState } from "react";

import { EmitterControls } from "./components/emitter-controls";
import { ParticlePreview } from "./components/particle-preview";
import { PreviewStatus } from "./components/preview-status";
import type { ParticlePreviewHandle } from "./types/controls";
import type { PreviewControls } from "./types/preview";

export function App() {
  const preview = useRef<ParticlePreviewHandle>(null);
  const [controls, setControls] = useState<PreviewControls | null>(null);
  const [error, setError] = useState("");
  const ready = controls !== null;

  function update(patch: Partial<PreviewControls>) {
    const applied = preview.current?.update(patch);
    if (applied) {
      setControls(applied);
    }
  }

  function reset() {
    preview.current?.reset();
  }

  return (
    <main>
      <header>
        <h1>Reparticle demo</h1>
        <p>GPU particle simulation with PixiJS rendering.</p>
      </header>

      <section className="workspace">
        <ParticlePreview
          ref={preview}
          onReady={setControls}
          onError={setError}
        />

        {controls && (
          <EmitterControls
            controls={controls}
            disabled={!ready}
            onChange={update}
            onReset={reset}
          />
        )}
      </section>

      <PreviewStatus controls={controls} ready={ready} error={error} />
    </main>
  );
}
