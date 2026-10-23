import { ExampleSelect } from './components/example-select';
import { PlaybackControls } from './components/playback-controls';
import { useExamplePlayer } from './hooks/use-example-player';

export function App() {
  const { host, loading, error, example, paused, select, togglePlayback, restart } =
    useExamplePlayer();

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
