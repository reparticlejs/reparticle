import { useState } from 'react';

import { ExampleSelect } from './components/example-select';
import { PlaybackControls } from './components/playback-controls';
import { examples } from './examples';
import { usePixiApp } from './hooks/use-pixi-app';
import type { Example } from './types/example';

export function App() {
  const [example, setExample] = useState(examples[0]!);
  const { host, appReady, exampleReady, error, paused, select, togglePlayback, restart } =
    usePixiApp(example);

  function selectExample(selected: Example) {
    setExample(selected);
    void select(selected);
  }

  return (
    <main>
      <div className="demo" ref={host}>
        {error && <p role="alert">{error}</p>}
      </div>
      <aside className="sidebar">
        <ExampleSelect example={example} disabled={!appReady} onSelect={selectExample} />
        <PlaybackControls
          paused={paused}
          disabled={!exampleReady}
          onToggle={togglePlayback}
          onRestart={restart}
        />
      </aside>
    </main>
  );
}
