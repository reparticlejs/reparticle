# @reparticle/pixi

## 0.2.0

### Minor Changes

- a57fb73: Add WebGPU simulation and Pixi rendering with automatic backend loading during Pixi initialization. Explicit `/webgl2` and `/webgpu` imports exclude the other backend while preserving effect JSON and playback controls.

  Make the core root backend-neutral: import `EmitterController` from `@reparticle/core`, or a device-specific `Emitter` from `@reparticle/core/webgl2` or `@reparticle/core/webgpu`. Remove the redundant `/runtime` entry point.

### Patch Changes

- Updated dependencies [a57fb73]
  - @reparticle/core@0.2.0
