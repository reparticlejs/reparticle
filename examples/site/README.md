# Reparticle site

Astro homepage and examples gallery, with a React island for the live player.

From the repository root:

```sh
pnpm dev:site
```

Build with `pnpm build`, then preview with `pnpm --filter @reparticle/site preview`.

The site imports the demo's player hook and ordered example catalog through
`@reparticle/demo`. Astro serves `../demo/public` directly, so effects and artwork
have one source. Add or edit examples in the demo; the gallery follows automatically.
Only the selected effect runs, using one Pixi application per page.

Asset credits and licenses are documented in [the demo README](../demo/README.md).

## Documentation and property lab

- `src/pages/docs`: introduction, quick start, concepts, and curves.
- `src/content/api/core` and `src/content/api/pixi`: generated API pages; edit source types and JSDoc instead.
- `src/content/properties.ts`: descriptions, defaults, and experiment values.
- `src/pages/lab/[property].astro`: static page for each experiment.

The lab creates inline effect definitions and passes them to the existing demo
player. It keeps one Pixi application alive while replacing the selected effect.
Core values are validated before playback; artwork remains a separate renderer
binding. Supported changes use live emitter and renderer APIs. Birth settings affect future
particles; construction-only settings rebuild the effect. Live edits preserve pause
state and display-object motion. Sliders for reconstruction-only settings commit
once on release (or keyboard completion/blur), rather than rebuilding during drag.

Run `pnpm --filter @reparticle/site test` to validate every experiment and route ID.

## Generated API

Like pixi-silk, the site uses TypeDoc and typedoc-plugin-markdown, with a small
Astro adaptation step that adds page metadata and converts Markdown links
to Astro page URLs. TypeDoc manages output generation and cleanup. Shared TypeDoc options live in
`typedoc.json`; the script selects each package and adapts its generated pages. `pnpm --filter @reparticle/site build:api` reads each
package's `src/index.ts` and regenerates its API pages. Site dev and build run it
automatically; rerun it after editing library source during a running dev session.
Generated pages remain in the repository so they are inspectable. Never edit them
by hand: regeneration replaces each package directory and removes stale pages.

`tsconfig.api.json` resolves both packages from source, including core's GPU.js
ambient declarations. TypeDoc uses TypeScript's compatibility API for analysis;
it does not change the library compiler. The `@interface` JSDoc tag exposes
object-shaped Zod aliases as property reference pages without changing their types.
TypeDoc owns signature and type rendering without custom converter hooks.
Zod-derived aliases may expand inline in signatures. TypeDoc's native object expansion,
declaration visibility, and conversion depth options render nested inferred fields
inline. There are no synthetic type names, nested-object pages, or structural
matching passes. Shapes remain derived from source without duplicate interfaces.
Navigation and search are built from the generated pages. Human explanations and
interactive experiments stay under Docs and Lab.

Generated API Markdown is content, not a page: it has no layout imports.
`src/pages/api/[...path].astro` applies the API layout. Navigation reads Astro’s
parsed content metadata directly, without depending on layouts or routes.

## Site shell

The header, footer, documentation grid, sidebar, typography, theme tokens, and fonts
are adapted from [pixi-silk](https://github.com/schmooky/pixi-silk). Its Tailwind
styles live in `src/styles/main.css`; Reparticle's interactive preview and curve
control styles are isolated in `src/styles/player.css`. License notices for the
shell and bundled fonts are in `licenses/`.
