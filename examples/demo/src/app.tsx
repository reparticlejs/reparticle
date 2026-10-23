import { useState } from 'react';

import { ExampleSelect } from './components/example-select';
import { PlaybackControls } from './components/playback-controls';
import { examples } from './examples';
import { usePixiApp } from './hooks/use-pixi-app';
import type { Example } from './types/example';

export function App() {
  const [example, setExample] = useState(examples[0]!);
  const [paused, setPaused] = useState(false);
  const { host, player, exampleReady, error, select } = usePixiApp(example);

  function selectExample(selected: Example) {
    setPaused(false);
    setExample(selected);
    void select(selected);
  }

  function togglePlayback() {
    player?.setPaused(!paused);
    setPaused(!paused);
  }

  function restart() {
    player?.restart();
    setPaused(false);
  }

  return (
    <main>
      <div className="demo" ref={host}>
        {error && <p role="alert">{error}</p>}
      </div>
      <aside className="sidebar">
        <ExampleSelect example={example} disabled={!player} onSelect={selectExample} />
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
