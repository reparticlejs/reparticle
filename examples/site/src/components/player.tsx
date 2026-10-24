import { examples } from '@reparticle/demo/examples';
import { useExamplePlayer } from '@reparticle/demo/use-example-player';

/** Both pages use the demo player; the gallery adds only an effect picker. */
export default function Player({ gallery = false }: { gallery?: boolean }) {
  const initial = examples.find((example) => example.id === 'magical-aura') ?? examples[0];
  const { host, example, loading, error, paused, select, togglePlayback, restart } =
    useExamplePlayer(initial);

  return (
    <div className={gallery ? 'player gallery-player' : 'player'}>
      {gallery && (
        <aside className="effect-list" aria-label="Effects">
          <div className="list-heading">
            Effects <span>{examples.length}</span>
          </div>
          {examples.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={example.id === item.id}
              disabled={loading}
              onClick={() => void select(item)}
            >
              <span className="effect-number">{String(index + 1).padStart(2, '0')}</span>
              {item.name}
            </button>
          ))}
        </aside>
      )}
      <section className="preview" aria-label={`${example.name} live preview`}>
        <div className="canvas-host" ref={host}>
          {loading && <output className="player-message">Loading effect…</output>}
          {error && (
            <p className="player-message error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="player-toolbar">
          <span className="effect-title">{example.name}</span>
          <div className="playback">
            <button type="button" disabled={loading || !!error} onClick={togglePlayback}>
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button type="button" disabled={loading || !!error} onClick={restart}>
              Restart
            </button>
            {gallery && (
              <a
                href={`${import.meta.env.BASE_URL}${example.file}`}
                target="_blank"
                rel="noreferrer"
              >
                JSON ↗
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
