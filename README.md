# Reparticle

A GPU.js particle proof of concept: JavaScript-authored simulation with a separate PixiJS renderer. No editor or Replayable dependency.

## Run

Use Node.js 24+ and pnpm 10.32.1.

```sh
pnpm install --ignore-scripts
pnpm dev
```

Open the local URL printed by Vite. For mobile testing, connect your phone to the same Wi-Fi and open the **Network** URL printed by `pnpm dev`. Both Vite dev and preview servers listen on the local network. Press and drag inside the preview to position the emitter. Adjust emission, gravity, and lifetime; pause or reset the simulation. Choose a gold star, leaf, blue spark, or procedural circle and adjust particle size.

Requires WebGL2 and `EXT_color_buffer_float`. Unsupported devices show an error; there is no silent CPU fallback.

## Architecture roadmap

[Particle architecture and implementation roadmap](docs/particle-architecture.md) records the full Defold feature target, JSON contract, current status, and implementation order. Validated JSON now creates the emitter and drives supported runtime parameter updates.

## Structure

- `packages/core`: GPU.js 2.24.1 simulation, mathematical behaviors, bounded spawn scheduling. No Pixi dependency. Takes a host WebGL2 context; this GPU backend is browser-based, not a headless CPU implementation.
- `packages/core/src/gpujs`: typed GPU storage adapters. Readable motion and spawning math lives in `src/behaviors`. GPU.js receives ordinary functions directly through `createKernel` and `addFunction`, using its published types.
- `packages/pixi`: shares Pixi's WebGL2 context and renders directly from the simulation texture with one instanced draw. No Sprite per particle or CPU particle array.
- `examples/demo`: React/TypeScript UI with a Pixi preview. React owns controls and status; Pixi owns the animation loop.

GPU state contains position, velocity, age, and lifetime. Built-in spawn, lifetime, gravity, and motion responsibilities are separated: gravity contributes acceleration before motion integrates once per axis; lifetime handles age and activity. They execute together in one update pass. Two mutable update kernels alternate output textures; both are allocated and warmed before playback. The CPU sends only time, emitter parameters, and a spawn range. The fixed-capacity ring recycles the oldest slots when full; dead particles are hidden in the vertex shader. The UI displays capacity separately from the live count. The demo’s devtools tracker mirrors the spawn schedule and tracks batches with float32 age accumulation, expiration, and ring overwrites without GPU readbacks. Core has no debug counter or tracking overhead. Demo bookkeeping scales with live birth batches rather than allocated slots; future lifetime distributions or death behaviors must extend this tracker.

Core owns simulation resources; the Pixi view owns its core emitter and drawing resources. Destroy the view before destroying the renderer. Core never destroys the host GL context. GPU.js canvas-size changes during compilation and GL-state restoration are handled at the integration boundary.

## Checks

```sh
pnpm check
pnpm format
```

`check` runs lint, type checks, spawn-schedule tests, and production builds. Unit tests do not substitute for GPU execution.

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
import { Assets } from 'pixi.js';
import { ParticleView } from '@reparticle/pixi';

const definition = await fetch('/effect.json').then((response) => response.json());
const particles = new ParticleView(app.renderer, definition);
particles.texture = await Assets.load('/textures/spark.png');
particles.emitter.setParameters({ initial: { size: 24 } }); // future births; longest edge
app.stage.addChild(particles);
app.ticker.add((ticker) => particles.update(Math.min(ticker.deltaMS / 1000, 0.05)));
```

Use a WebGL renderer. Textures are ordinary Pixi `Texture` instances loaded through `Assets`. The example includes original SVG artwork rasterized by Pixi; PNG and other Pixi-supported image formats work through the same API. Images upload on first use, then the shader samples them directly on the GPU. Switching `particles.texture` changes the artwork for all particles without restarting simulation. Set it to `null` for the procedural circle.

Untrimmed, unrotated atlas frames are supported through their UV rectangle. Trimmed or rotated frames are rejected explicitly. This example does not animate spritesheets. The caller owns the texture; destroying a view does not destroy shared artwork. No automatic bounds calculation or hit testing is added.

## Development stats

The demo uses a source copy of Replayable's stats module in `examples/demo/src/devtools`, with its MIT license retained. It has no Replayable dependency and is not included in the core or Pixi library packages. D3 supplies the copied history graphs; Sass compiles their stylesheet.

The overlay shows FPS, living particle count, frame interval, browser JS heap when available, and WebGL draw calls, texture binds, and program uses. Sampling runs after Pixi renders. Draw counts include GPU.js simulation draws, particle rendering, and any other Pixi scene objects; they are API submissions, not GPU execution timings. Hide stats suspends sampling and removes instrumentation.

## Authoring simulation behavior

Edit ordinary TypeScript functions in `packages/core/src/behaviors/motion.ts` and `spawn.ts`. They have type checking, autocomplete and direct numerical tests. The `src/gpujs/integrate.ts` adapter handles the two-texel particle layout and calls those functions.

Core uses its normal TypeScript package build. There is no kernel generator or consumer build plugin. The demo imports the built packages in both development and production. `pnpm dev` builds the libraries before starting the demo. After library changes, rebuild them or run `pnpm --filter @reparticle/core exec tsdown --watch` and `pnpm --filter @reparticle/pixi exec tsdown --watch` in separate terminals.

GPU.js compiles the JavaScript function bodies at runtime, so they must stay within its supported numeric subset. Keep spawn locals in the separate `src/gpujs/spawn-motion.ts` helper: GPU.js can misidentify block-local variables when a minifier gives them the same name as a parameter. The current functions were checked under default Rolldown and Terser minification in a plain HTML page, including nonzero spawn velocity, gravity, reset, expiration, and playback GPU residency. New kernel changes should be checked in a minified browser build as well as unit tests.

## Effect configuration and runtime parameters

Pass an effect JSON object to `new ParticleView(renderer, definition)`. Validation happens before GPU allocation. See [the JSON skeleton](docs/effect.example.json); the demo loads `examples/demo/public/effect.json`. Core-only consumers can pass `parseEffectConfig(definition).emitters[0]` to `new Emitter({ gl, canvas }, emitterDefinition)`.

```ts
particles.emitter.setParameters({ emission: { rate: 1500 } });
particles.emitter.setParameters({ initial: { lifetime: 3, speed: 180 } });
particles.emitter.setParameters({ modifiers: { gravity: { y: 80 } } });
```

Updates are validated atomically. Capacity, seed, ID and shape type cannot be changed through this method; create a new instance from an updated definition. `emitter.configuration` returns an independent snapshot for that purpose. Position and playback remain runtime controls. Initial values affect new births; gravity affects living particles. Horizontal gravity currently must be zero. Scalar speed is exact; implicit speed variation, shrinking and fading have been removed. Texture selection and particle size remain renderer controls until their JSON fields are implemented. No new API accepts executable particle behavior.

## Demo UI

The demo uses React with the official Vite React plugin. `src/app.tsx` owns UI settings and status. `App` creates a shared preview controller. UI event handlers call its setControls/reset commands, and `ParticlePreview` uses `useEmitterDrag` to forward press-and-drag movement to it. `usePreviewRenderer` mounts the renderer, attaches it to the controller, then detaches and destroys it on cleanup. Only `useMountEffect` imports `useEffect`; settings are applied directly from events. `EmitterControls` edits settings, and `PreviewStatus` displays status and errors. `src/preview/create-preview.ts` assembles the Pixi application, scene, ticker, and cleanup. `load-preview-assets.ts` loads JSON and textures; `PreviewScene` manages scene settings and movement; `particle-view.ts` creates and replaces views; `devtools/create-preview-stats.ts` owns stats and debug counting. Types live in `src/types`; tests live in `tests`. React dependencies belong only to the demo.

GPU updates run on Pixi's ticker without React state updates per frame. Controls are disabled until asynchronous initialization succeeds. Unmounting, Strict Mode remounts, failed startup, and hot reload release the owned GPU scene and stats. Shared artwork remains owned by Pixi's asset cache.

### Circle emitter

The demo offers Point, Circle, Box, and 2D Cone shapes.

```json
"shape": { "type": "circle", "diameter": 100 }
```

Circle births follow [Defold's circle semantics](https://defold.com/manuals/particlefx/): positions fill the disk uniformly, and velocity points radially outward at the configured speed. Diameter is measured in simulation units; zero collapses positions to the emitter while preserving radial directions. Point-only `initial.direction` and `initial.spread` do not influence circle births.

Update diameter for future births without resetting living particles:

```ts
emitter.setParameters({ emission: { shape: { diameter: 200 } } });
```

Changing shape type recreates the emitter and clears particles in the demo. Changing diameter does not. All spawning stays in the existing GPU update pass; no per-particle CPU work or texture readbacks are added.

### Box emitter

A box uses full width and height:

```json
"shape": { "type": "box", "width": 200, "height": 100 }
```

Following [Defold box behavior](https://defold.com/manuals/particlefx/), births fill the rectangle uniformly and initial velocity points upward at `initial.speed`. Width and height are full dimensions, centered on the emitter. Our canvas has downward-positive Y, so upward velocity is negative Y. Point direction/spread do not apply. Zero dimensions are allowed.

Numeric width/height updates affect future births without recompiling or clearing particles. This implements Defold's zero-depth box; 3D depth and emitter rotation remain pending.

### GPU function build

Core's package build compiles the typed GPU functions and kernels into JavaScript source strings before minification. The generated strings are bundled into `dist/index.js`; GPU.js compiles them on the device. Consumers do not need a build plugin or minifier settings. There is no runtime source rewriting.

Edit the TypeScript behaviors and kernels, then rebuild core. `src/gpujs/functions.ts` lists the build inputs; `src/gpujs/functions.json` is committed so fresh checkouts have valid imports. Regenerate it rather than editing it by hand, and include its changes when committing kernel changes. Core's build command regenerates it automatically; typecheck and tests use the committed file.

### 2D cone emitter

The demo starts with a 2D cone:

```json
"shape": { "type": "cone2d", "width": 200, "height": 100 }
```

Following [Defold's 2D cone behavior](https://defold.com/manuals/particlefx/), positions fill a triangle uniformly. The emitter is its tip; the opposite edge is one height above it, with the full configured width. Initial velocity points away from the tip through the birth position at `initial.speed`. Upward is negative Y in our canvas coordinates. Point direction/spread do not apply.

Width and height can change at runtime and affect only future births. Both may be zero: width zero collapses to a vertical line, height zero to a horizontal line, and both zero to the tip with upward velocity. This is a flat triangle, not the pending 3D cone.

### Duration and playback

Each emitter accepts `"duration": 1` (seconds) and `"playMode": "once"` or `"loop"`. Omitted settings default to a one-second loop, retaining continuous emission for older effects.

Following [Defold's emitter timing](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L785-L844), once emits through the entire update that reaches duration, then stops spawning. Existing particles continue moving and aging. Loops restart the emitter timer without clearing particles, fractional emission, or the random sequence. Zero-duration once emits for one positive update; zero-duration loop emits continuously. Zero-time warm-up updates do not consume playback.

`emitter.isEmitting` reports emission eligibility at the current playback clock; pending prewarm has not yet advanced that clock. The existing `emitter.emitting` boolean remains a manual emission gate; turning it off does not pause the clock or restart a completed effect. Pause by skipping updates. `reset()` clears particles and restarts the timer, spawn schedule, and seed. Duration/mode changes require recreation; the demo restarts the effect when either control changes.

`startDelay` defaults to `0` seconds. Following Defold, the delay is checked before advancing each frame: the frame reaching the delay still waits, and the next frame emits. Delay overshoot contributes to the duration clock. Loops do not repeat the delay; reset does. Changing start delay in the demo restarts the effect. Like duration, it is a structural setting rather than a runtime parameter patch.

### Start offset / prewarm

`startOffset` defaults to `0` seconds. Following [Defold StartInstance and FastForwardEmitter](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L313-L324), prewarm runs full 1/60-second steps, capped at the maximum particle lifetime (`initial.lifetime` for our current scalar configuration). Offsets below 0.0001 seconds are ignored. The last step is not shortened, and the prewarm timer uses float32 accumulation like Defold.

Prewarm includes start delay and normal once/loop timing. A once emitter can finish emission during prewarm, leaving only its surviving particles. The simulation advances on the GPU, including position, velocity, age, spawn carry, and random sequence; there is no particle readback.

Reparticle applies prewarm before the first positive `update`, after you have set the emitter position. `update(0)` does not consume it. `reset()` clears the simulation and schedules prewarm again at the current position. The normal update runs after the prewarm steps. Changing start offset requires recreation; the demo does this automatically and includes prewarmed particles in its stats.

Prewarm has a one-time startup cost proportional to the simulated steps and allocated capacity. `EmitterPlayback` and `prewarm` expose the shared timing logic; the demo uses them for its separate debug counter, without putting particle counting into the runtime.

### Size over lifetime

`initial.size` is the particle's birth size in local units (longest edge, preserving texture aspect ratio). It defaults to `24`. Runtime updates affect future births only; existing particles retain their stored birth size. The procedural circle uses the same sizing as textured particles.

`overLifetime.scale` multiplies birth size using normalized particle age: `0` at birth and `1` at death. It defaults to constant `1`. This follows Defold's **Initial Size × Life Scale** model. A number supplies a constant multiplier; a curve supplies points:

```json
"overLifetime": {
  "scale": {
    "points": [
      { "time": 0, "value": 0, "tangent": 0 },
      { "time": 0.2, "value": 1, "tangent": 0 },
      { "time": 1, "value": 0, "tangent": 0 }
    ]
  }
}
```

Points must be ordered with unique times in `[0, 1]`. Each `tangent` is a slope (`dy/dx`, equivalent to Defold's `ty/tx`); omitted tangents default to zero. Interpolation uses cubic Hermite curves. A single point uses its tangent as a line. Values and slopes may be signed; scale is not clamped, matching Defold. Use endpoints at `0` and `1` to define the full life interval explicitly.

Like Defold, curves are baked into 64 linear segments. Pixi uploads the 65 endpoint samples once when creating a view and evaluates the curve in the vertex shader. Birth size occupies the formerly unused fourth lifetime channel: the particle texture stays the same size, with no extra simulation pass or readback. Curve changes require recreation. The demo offers the JSON curve, constant scale, shrink, and grow-then-shrink presets.

This implements scalar initial size and lifetime scale. Initial-size spread, emitter-time size curves, and automatic animated-frame sizing remain separate features. The former `ParticleView.particleSize` renderer override is replaced by `initial.size` in configuration or `emitter.setParameters`.

References: [Defold particle properties](https://defold.com/manuals/particlefx/#keyable-emitter-properties), [Hermite curve sampling](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L120-L175), and [64-segment resolution](https://github.com/defold/defold/blob/dev/engine/particle/src/particle_private.h#L27).
