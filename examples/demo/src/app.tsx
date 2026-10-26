import { examples } from '@reparticle/examples';
import { PlaybackControls, useExamplePlayer } from '@reparticle/player';

import { ExampleSelect } from './components/example-select';

export function App() {
  const { host, loading, error, example, paused, select, togglePlayback, restart } =
    useExamplePlayer(examples[0]!);

  return (
    <main>
      <div className="demo" ref={host}>
        {error && <p role="alert">{error}</p>}
      </div>
      <aside className="sidebar">
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
