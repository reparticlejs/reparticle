# Copied Replayable stats

Copied from Replayable `packages/devtools/src/stats`, its supporting types and interaction helper. Original MIT license retained in LICENSE. No Replayable package dependency.

Adaptations: relative imports, local config types, explicit existing WebGL context registration, document visibility, and a host-provided post-render subscription instead of the Replayable runtime. D3 and Sass remain ordinary tooling dependencies for the copied graphs and styles.

The demo supplies Pixi ticker timing after rendering. Hide stops measurement and removes GL wrappers; destroy also removes DOM, subscriptions and context registration. FPS/frame interval reflect the host loop, JS heap is browser-dependent and excludes GPU memory; WebGL counters count submitted API operations (including GPU.js simulation draws), not GPU timings.
