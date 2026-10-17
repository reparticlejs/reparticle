# Reparticle

A GPU.js particle proof of concept: JavaScript-authored simulation with a separate PixiJS renderer. No editor or Replayable dependency.

## Run

Use Node.js 24+ and pnpm 10.32.1.

```sh
pnpm install --ignore-scripts
pnpm dev
```

Open the local URL printed by Vite. For mobile testing, connect your phone to the same Wi-Fi and open the **Network** URL printed by `pnpm dev`. Both Vite dev and preview servers listen on the local network. Move the pointer across the preview to position the emitter. Adjust emission, gravity, and lifetime; pause or reset the simulation. Choose a gold star, leaf, blue spark, or procedural circle and adjust particle size.

Requires WebGL2 and `EXT_color_buffer_float`. Unsupported devices show an error; there is no silent CPU fallback.

## Architecture roadmap

[Particle architecture and implementation roadmap](docs/particle-architecture.md) records the full Defold feature target, JSON contract, current status, and implementation order. Validated JSON now creates the emitter and drives supported runtime parameter updates.

## Structure

- `packages/core`: GPU.js 2.24.1 simulation, mathematical behaviors, bounded spawn scheduling. No Pixi dependency. Takes a host WebGL2 context; this GPU backend is browser-based, not a headless CPU implementation.
- `packages/core/src/gpujs`: typed GPU storage adapters. Readable motion and spawning math lives in `src/behaviors`. GPU.js receives ordinary functions directly through `createKernel` and `addFunction`, using its published types.
- `packages/pixi`: shares Pixi's WebGL2 context and renders directly from the simulation texture with one instanced draw. No Sprite per particle or CPU particle array.
- `examples/demo`: TypeScript/Vite preview and explicit GPU diagnostics.

GPU state contains position, velocity, age, and lifetime. Two mutable update kernels alternate output textures; both are allocated and warmed before playback. The CPU sends only time, emitter parameters, and a spawn range. The fixed-capacity ring recycles the oldest slots when full; dead particles are hidden in the vertex shader. The UI displays capacity, not a fabricated live-particle count.

Core owns simulation resources; the Pixi view owns its core emitter and drawing resources. Destroy the view before destroying the renderer. Core never destroys the host GL context. GPU.js canvas-size changes during compilation and GL-state restoration are handled at the integration boundary.

## Checks

```sh
pnpm check
pnpm format
```

`check` runs lint, type checks, spawn-schedule tests, and production builds. Unit tests do not substitute for GPU execution.

Click **Validate GPU residency** in the demo for actual GPU verification. It runs 120 simulation/render frames and instruments readbacks, uploads, and allocations. After that measured interval, explicit diagnostic texel reads compare gravity integration to an independent analytical result and check reset and expiration. It also checks exact spawn speed and that initial-property changes affect future births while gravity changes affect living particles. Diagnostic reads are intentional and never part of normal playback.

## Prototype limits

- WebGL2 only. The prior WebGPU experiment has not been ported into these packages.
- Main-canvas rendering with textured quads (normal alpha blending) or additive procedural circles. Masks, filters, render textures, and context-loss recovery are not supported yet.
- GPU.js's browser compiler is included at runtime, increasing bundle size. Precompiled kernels are future work.
- Default capacity is 100,000; construction accepts up to 1,000,000 subject to GPU texture limits. This is a capacity limit, not a cross-device performance guarantee.
- Updates accept 0–0.1 seconds. The demo clamps long frames to 0.05 seconds, avoiding a large catch-up after tab suspension.
- No editor, serialization, public custom-behavior API, WebGPU backend, or new comparative benchmark is included.

## Provenance

The shared-context/ping-pong integration was adapted from the local GPU.js–Pixi prototype at `Documents/Codex/2026-10-16/now/outputs/gpu-pixi-prototype`. The original benchmarks remain there; their reported results are not claimed as measurements of this lifecycle-enabled implementation.

## Custom particle textures

```ts
import { Assets } from "pixi.js";
import { ParticleView } from "@reparticle/pixi";

const definition = await fetch("/effect.json").then((response) => response.json());
const particles = new ParticleView(app.renderer, definition);
particles.texture = await Assets.load("/textures/spark.png");
particles.particleSize = 24; // longest edge; aspect ratio is preserved
app.stage.addChild(particles);
app.ticker.add((ticker) => particles.update(Math.min(ticker.deltaMS / 1000, 0.05)));
```

Use a WebGL renderer. Textures are ordinary Pixi `Texture` instances loaded through `Assets`. The example includes original SVG artwork rasterized by Pixi; PNG and other Pixi-supported image formats work through the same API. Images upload on first use, then the shader samples them directly on the GPU. Switching `particles.texture` changes the artwork for all particles without restarting simulation. Set it to `null` for the procedural circle.

Untrimmed, unrotated atlas frames are supported through their UV rectangle. Trimmed or rotated frames are rejected explicitly. This example does not animate spritesheets. The caller owns the texture; destroying a view does not destroy shared artwork. No automatic bounds calculation or hit testing is added.

## Development stats

The demo uses a source copy of Replayable's stats module in `examples/demo/src/devtools`, with its MIT license retained. It has no Replayable dependency and is not included in the core or Pixi library packages. D3 supplies the copied history graphs; Sass compiles their stylesheet.

The overlay shows FPS, frame interval, browser JS heap when available, and WebGL draw calls, texture binds, and program uses. Sampling runs after Pixi renders. Draw counts include GPU.js simulation draws, particle rendering, and any other Pixi scene objects; they are API submissions, not GPU execution timings. Hide stats suspends sampling and removes instrumentation. The explicit GPU validation temporarily suspends stats and restores the user's visibility choice afterward.

## Authoring simulation behavior

Edit ordinary TypeScript functions in `packages/core/src/behaviors/motion.ts` and `spawn.ts`. They have type checking, autocomplete and direct numerical tests. The `src/gpujs/integrate.ts` adapter handles the two-texel particle layout and calls those functions.

Core uses its normal TypeScript package build. There is no kernel generator or consumer build plugin. The demo imports the built packages in both development and production. `pnpm dev` builds the libraries before starting the demo. After library changes, rebuild them or run `pnpm --filter @reparticle/core exec tsdown --watch` and `pnpm --filter @reparticle/pixi exec tsdown --watch` in separate terminals.

GPU.js compiles the JavaScript function bodies at runtime, so they must stay within its supported numeric subset. Keep spawn locals in the separate `src/gpujs/spawn-motion.ts` helper: GPU.js can misidentify block-local variables when a minifier gives them the same name as a parameter. The current functions were checked under default Rolldown and Terser minification in a plain HTML page, including nonzero spawn velocity, gravity, reset, expiration, and playback GPU residency. New kernel changes should be checked in a minified browser build as well as unit tests.

## Effect configuration and runtime parameters

Pass an effect JSON object to `new ParticleView(renderer, definition)`. Validation happens before GPU allocation. See [the JSON skeleton](docs/effect.example.json); the demo loads `examples/demo/src/effect.json`. Core-only consumers can pass `parseEffectConfig(definition).emitters[0]` to `new Emitter({ gl, canvas }, emitterDefinition)`.

```ts
particles.emitter.setParameters({ emission: { rate: 1500 } });
particles.emitter.setParameters({ initial: { lifetime: 3, speed: 180 } });
particles.emitter.setParameters({ modifiers: { gravity: { y: 80 } } });
```

Updates are validated atomically. Capacity, seed, ID and shape cannot be changed through this method; create a new instance from an updated definition. `emitter.configuration` returns an independent snapshot for that purpose. Position and playback remain runtime controls. Initial values affect new births; gravity affects living particles. Horizontal gravity currently must be zero. Scalar speed is exact; implicit speed variation, shrinking and fading have been removed. Texture selection and particle size remain renderer controls until their JSON fields are implemented. No new API accepts executable particle behavior.
