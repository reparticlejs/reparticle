import { ExampleSelect } from './components/example-select';
import { PlaybackControls } from './components/playback-controls';
import { usePixiApp } from './hooks/use-pixi-app';

export function App() {
  const { host, appReady, exampleReady, error, example, paused, select, togglePlayback, restart } =
    usePixiApp();

  return (
    <main>
      <div className="demo" ref={host}>
        {error && <p role="alert">{error}</p>}
      </div>
      <aside className="sidebar">
        <ExampleSelect example={example} disabled={!appReady} onSelect={select} />
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
