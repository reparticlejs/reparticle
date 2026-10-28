import { examples } from '@reparticle/examples';
import { BackendSelect, PlaybackControls, useExamplePlayer } from '@reparticle/player';

import { ExampleSelect } from './components/example-select';

export function App() {
  const {
    host,
    loading,
    error,
    example,
    paused,
    backend,
    selectBackend,
    select,
    togglePlayback,
    restart,
  } = useExamplePlayer(examples[0]!);

  return (
    <main>
      <div className="demo" ref={host}>
        {error && <p role="alert">{error}</p>}
      </div>
      <aside className="sidebar">
        <BackendSelect value={backend} onChange={selectBackend} />
        <ExampleSelect example={example} disabled={loading} onSelect={select} />
        <PlaybackControls
          paused={paused}
          disabled={loading || !!error}
          onToggle={togglePlayback}
          onRestart={restart}
        />
      </aside>
    </main>
  );
}
