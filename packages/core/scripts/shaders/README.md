# WebGL2 shader build

`pnpm build:shaders` resolves the authored functions in `src/simulation` with TypeGPU's public APIs and atomically writes `src/simulation/shaders.json`. There is no source-to-source adapter, private compiler import, or runtime compiler. TypeGPU is a development dependency only. WebGPU is not generated.

`compile.ts` supplies the native WebGL2 boundary: uniform bindings, birth/update passes, and output packing. The simulation keeps two changing-state bands in ping-pong textures and three birth-data bands in a separate texture. Curves and modifier records are read directly from the uniform block; passing their entire arrays through GLSL functions causes a large slowdown on the tested ANGLE/Metal backend.

Two explicit adaptations remain for the pinned experimental `@typegpu/gl` generator:

- Replace its single plain `SimulationData` uniform declaration with our `std140` block declaration. The build rejects unexpected declaration output. Function bodies are not rewritten.
- Provide GLSL's two-argument `atan` under the emitted `atan2` name.

`src/simulation/layout.ts` defines buffer sizes shared with CPU packing. `resources.ts` describes their TypeGPU types. `propertyVariation` stays a plain TypeScript function because CPU slot bookkeeping and GPU births share the same hash.

CPU tests execute the authored shader math with GPU storage reads mocked. `packages/core/tests/browser` checks real WebGL2 state, and `packages/pixi/tests/browser` checks Pixi rendering and playback. Each package runs its unit and browser tests through Vitest. They also run as part of `pnpm test` and `pnpm check`; see the repository README for browser setup.
