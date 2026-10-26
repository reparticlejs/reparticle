# @reparticle/player

Private React components and playback runtime shared by the site and demo.
This workspace package exports source; Vite and Astro compile it in each app.

- `@reparticle/player`: `Player`, `PlaybackControls`, and `useExamplePlayer`.
- `@reparticle/player/curve-editor`: `CurveEditor`, independent of the Pixi player.
- `@reparticle/player/types`: player, artwork, update, and component props.
- `@reparticle/player/styles.css`: optional preview and gallery styles.
- `@reparticle/player/curve-editor.css`: curve editor styles, including touch handling.

Pass an initial example to the player or hook. The package does not import a preset
catalog or either application. `examples/shared` supplies presets and assets to
consumers that want the example gallery. Asset URLs use the application's Vite/Astro
base URL; the app must serve the referenced files.

The player owns its Pixi application and active effect. Cached artwork stays owned
by Pixi Assets. The curve editor accepts a curve and reports edits through `onApply`;
site-specific property forms stay in the site.

Styles inherit the site's theme variables when present and provide fallback colors.
Import the stylesheet for the component you use. The demo retains its own page styling.

Run `pnpm --filter @reparticle/player test` or `typecheck` to check this package.
