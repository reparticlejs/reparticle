import { useExamplePlayer } from '../hooks/use-example-player';
import type { PlayerProps } from '../types/player-props';
import { BackendSelect } from './backend-select';

/** Reusable preview with an optional effect picker; the caller supplies the catalog. */
export function Player({ initialExample, examples = [], gallery = false }: PlayerProps) {
  const {
    host,
    example,
    loading,
    error,
    paused,
    backend,
    selectBackend,
    select,
    togglePlayback,
    restart,
  } = useExamplePlayer(initialExample);

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
            {gallery && <BackendSelect value={backend} onChange={selectBackend} />}
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
