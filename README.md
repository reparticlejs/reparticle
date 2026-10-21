# Reparticle

A GPU.js particle proof of concept: JavaScript-authored simulation with a separate PixiJS renderer. No editor or Replayable dependency.

Particle concepts and behavior are inspired by [Defold](https://defold.com/).

## Run

Use Node.js 24+ and pnpm 10.32.1.

```sh
pnpm install --ignore-scripts
pnpm dev
```

Open the local URL printed by Vite. The sidebar has an effect dropdown, Pause/Resume, and Restart:
**Star fountain** (default) or **Multi-emitter**. Effects run automatically, with compact stats over the canvas.
For mobile testing, use Vite's Network URL on the same Wi-Fi network.

Requires WebGL2 and `EXT_color_buffer_float`. Unsupported devices show an error; there is no silent CPU fallback.

## Architecture roadmap

[Particle architecture and implementation roadmap](docs/particle-architecture.md) records the full Defold feature target, JSON contract, current status, and implementation order. Validated JSON now creates the emitter and drives supported runtime parameter updates.

## Structure

- `packages/core`: GPU.js 2.24.1 simulation, mathematical behaviors, bounded spawn scheduling. No Pixi dependency. Takes a host WebGL2 context; this GPU backend is browser-based, not a headless CPU implementation.
- `packages/core/src/simulation`: numeric emission, modifier, and particle functions, plus the kernels that combine them. `functions.ts` is the build entry; tracked `functions.json` contains the compiled strings.
- `packages/core/src/runtime`: `emitter.ts` coordinates `gpu/` execution, `playback/` timing and spawn requests, `particles/` allocation and ordering, `modifiers/` sampling, and `transforms/` positioning and velocity.
- `packages/core/src/index.ts`: public exports only.
- `packages/pixi`: shares Pixi's WebGL2 context and renders directly from the simulation texture with one instanced draw. No Sprite per particle or CPU copy of particle positions.
- `examples/demo`: React/TypeScript effect selector with a Pixi canvas. Pixi owns the animation loop.

GPU state contains position, velocity, age, lifetime, and appearance data. Built-in behaviors execute together in one update pass. Two mutable update kernels alternate output textures; both are allocated and warmed before playback. The CPU sends time, emitter parameters, and a compact spawn bitmask. Allocation metadata tracks free slots and captured lifetimes: existing particles expire before new births are admitted, living slots are never overwritten, and excess births are dropped without a backlog. Fractional emission carry remains intact. The bitmask packs 24 slots per float (16,668 bytes for 100,000 slots).

Positions, velocities, modifiers, and rendering remain on the GPU, with no readback or extra simulation pass. Allocation work visits birth batches and slots being born or expired, rather than every allocated particle each frame. Lifetime spread orders each new batch by sampled lifetime so expiration can stop at the first survivor.

Pixi orders living particles by Defold’s 16-bit remaining-lifetime key: longer remaining lifetimes draw first. Core sorts logical slot IDs every simulation step, including prewarm, using existing CPU lifetime metadata. Pixi uploads only the final order on each draw: one uint per living instance (4 bytes each), without moving simulation texels or reading the GPU. Expired entries use Defold’s forward swap-removal, births append in allocation order, and equal keys use the resulting logical index. Stable two-pass radix sorting costs O(live particles + 256) per simulation step; paused draws reuse the buffer. Emitters still draw in definition order.

Core owns simulation resources; the Pixi view owns its core emitters, and the renderer’s particle pipe owns drawing resources. Destroy the view before destroying the renderer. Core never destroys the host GL context. GPU.js canvas-size changes during compilation and GL-state restoration are handled at the integration boundary.

## Checks

```sh
pnpm check
pnpm format
```

`check` runs lint, type checks, spawn-schedule tests, and production builds. Unit tests do not substitute for GPU execution.

## Prototype limits

- WebGL2 only. The prior WebGPU experiment has not been ported into these packages.
- Main-canvas and RenderTexture rendering, including Pixi filters, graphics masks, sprite masks, and effects on parent containers. Supply bounds or a filter area explicitly; particle bounds are never scanned. Context-loss recovery is not supported yet.
- GPU.js's browser compiler is included at runtime, increasing bundle size. Precompiled kernels are future work.
- Core requires an explicit capacity; the demo starts at 8192 slots. Construction accepts up to 1,000,000 subject to GPU texture limits. This is a capacity limit, not a cross-device performance guarantee.
- Updates accept 0–0.1 seconds. Automatic updates split longer ticker deltas into bounded steps.
- No editor, serialization, public custom-behavior API, WebGPU backend, or new comparative benchmark is included.

## Provenance

The shared-context/ping-pong integration was adapted from the local GPU.js–Pixi prototype at `Documents/Codex/2026-10-16/now/outputs/gpu-pixi-prototype`. The original benchmarks remain there; their reported results are not claimed as measurements of this lifecycle-enabled implementation.

## Custom particle textures

```ts
import { Assets } from 'pixi.js';
import { parseEffectConfig } from '@reparticle/core';
import { ParticleEffect } from '@reparticle/pixi';

const definition = parseEffectConfig(
  await fetch('/effect.json').then((response) => response.json()),
);
const particles = new ParticleEffect(definition, { ticker: app.ticker });
particles.texture = await Assets.load('/textures/spark.png');
particles.emitter.setParameters({ initial: { size: 24 } }); // future births; longest edge
app.stage.addChild(particles);
// The effect updates automatically before app.ticker renders.
```

Use a WebGL renderer. Textures are ordinary Pixi `Texture` instances loaded through `Assets`. The example includes original SVG artwork rasterized by Pixi; PNG and other Pixi-supported image formats work through the same API. Images upload on first use, then the shader samples them directly on the GPU. Switching `particles.texture` changes the artwork for all particles without restarting simulation. Set it to `null` for the procedural circle.

Atlas frames support trim offsets and UV rotation. Multiple frames support flipbook animation. The caller owns the texture; destroying a view does not destroy shared artwork. No automatic bounds calculation or hit testing is added.

## Authoring simulation behavior

Edit ordinary TypeScript functions in `packages/core/src/simulation/emission`, `simulation/modifiers`, and `simulation/particles`. They have type checking, autocomplete and direct numerical tests. The `src/simulation/kernels/integrate.ts` adapter handles the five-texel particle layout and calls those functions.

Core uses its normal TypeScript package build. The package build compiles the numeric functions into tracked `src/simulation/functions.json` source strings; consumers need no build plugin or minifier configuration. The demo imports the built packages in both development and production. `pnpm dev` builds the libraries before starting the demo. After library changes, rebuild them or run `pnpm --filter @reparticle/core exec tsdown --watch` and `pnpm --filter @reparticle/pixi exec tsdown --watch` in separate terminals.

GPU.js compiles the packaged function strings at runtime, so the functions must stay within its supported numeric subset. Keep spawn locals in the separate `src/simulation/emission/motion.ts` helper: GPU.js can misidentify block-local variables when a minifier gives them the same name as a parameter. The current functions were checked under default Rolldown and Terser minification in a plain HTML page, including nonzero spawn velocity, gravity, reset, expiration, and playback GPU residency. New kernel changes should be checked in a minified browser build as well as unit tests.

## Effect configuration and runtime parameters

Pass an effect JSON object to `new ParticleEffect(definition)`. Validation happens before GPU allocation. See [the JSON skeleton](docs/effect.example.json); the demo loads `examples/demo/public/effect.json`. Core-only consumers can pass `parseEffectConfig(definition).emitters[0]` to `new Emitter({ gl, canvas }, emitterDefinition)`.

```ts
particles.emitter.setParameters({ emission: { rate: 1500 } });
particles.emitter.setParameters({ initial: { lifetime: 3, speed: 180 } });
particles.emitter.setParameters({
  modifiers: [
    { type: 'acceleration', magnitude: 80, rotation: 180 },
    { type: 'drag', magnitude: 0.2 },
    { type: 'acceleration', magnitude: 20, rotation: -90 },
  ],
});
```

Updates are validated atomically. Capacity, seed, ID and shape type cannot be changed through this method; create a new instance from an updated definition. `emitter.configuration` returns an independent snapshot for that purpose. Position and playback remain runtime controls. Initial values affect new births; modifiers affect living particles. Modifier updates replace the complete ordered list. Emitter entries run first, then root entries, in authored array order; repeated types are supported. Each scope allows up to 64 entries. Living and newborn positions advance once after all velocity changes, following Defold’s integration order. Newborns also age by the full simulation step; lifetime curves therefore use that advanced age on the first rendered frame. Existing particles expire strictly after their lifetime; newborns always survive their birth frame. An explicit GPU active flag keeps visibility, lifecycle notifications, and the debug live count consistent, including exact endpoints and zero-time updates. Scalar speed is exact; implicit speed variation, shrinking and fading have been removed. Texture selection remains a renderer control; initial size, initial alpha, and their lifetime curves are configured in JSON. No new API accepts executable particle behavior.

## Demo UI

Compact stats sit at the canvas’s top right. Click the overlay to cycle metrics,
including FPS and the combined live particle count. Counts use CPU ordering data
without reading GPU textures.

The demo uses React with the official Vite React plugin. `App` owns the effect
selection, `Demo` provides the sidebar and mounts one Pixi application, and `create-demo.ts`
loads JSON and artwork. Switching the keyed demo disposes the old application.
`ParticleEffect` uses `app.ticker` for automatic updates. Only `useMountEffect`
imports `useEffect`; no controller or settings synchronization layer is needed.

GPU updates run on Pixi's ticker without React state updates per frame. Unmounting, Strict Mode remounts, failed startup, and hot reload release the owned GPU scene. Shared artwork remains owned by Pixi's asset cache.

### Circle emitter

Core supports Point, Circle, Box, and 2D Cone shapes.

```json
"shape": { "type": "circle", "diameter": 100 }
```

Circle births follow [Defold's circle semantics](https://defold.com/manuals/particlefx/): positions fill the disk uniformly, and velocity points radially outward at the configured speed. Diameter is measured in simulation units; zero collapses positions to the emitter while preserving radial directions. Point-only `initial.direction` and `initial.spread` do not influence circle births.

Update diameter for future births without resetting living particles:

```ts
emitter.setParameters({ emission: { shape: { diameter: 200 } } });
```

Changing shape type requires recreating the emitter. Diameter can change at runtime. All spawning stays in the existing GPU update pass; no per-particle CPU work or texture readbacks are added.

### Box emitter

A box uses full width and height:

```json
"shape": { "type": "box", "width": 200, "height": 100 }
```

Following [Defold box behavior](https://defold.com/manuals/particlefx/), births fill the rectangle uniformly and initial velocity points upward at `initial.speed`. Width and height are full dimensions, centered on the emitter. Our canvas has downward-positive Y, so upward velocity is negative Y. Point direction/spread do not apply. Zero dimensions are allowed.

Numeric width/height updates affect future births without recompiling or clearing particles. This implements Defold's zero-depth box; 3D depth and emitter rotation remain pending.

### GPU function build

Core's package build compiles the typed GPU functions and kernels into JavaScript source strings before minification. The generated strings are bundled into `dist/index.js`; GPU.js compiles them on the device. Consumers do not need a build plugin or minifier settings. There is no runtime source rewriting.

Edit the TypeScript behaviors and kernels, then rebuild core. `src/simulation/functions.ts` lists the build inputs; `src/simulation/functions.json` is committed so fresh checkouts have valid imports. Regenerate it rather than editing it by hand, and include its changes when committing kernel changes. Core's build command regenerates it automatically; typecheck and tests use the committed file.

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

`emitter.isEmitting` reports emission eligibility at the current playback clock; pending prewarm has not yet advanced that clock. The existing `emitter.emitting` boolean remains a manual emission gate; turning it off does not pause the clock or restart a completed effect. Pause by skipping updates. `reset()` clears particles and restarts the timer, spawn schedule, and seed. Duration/mode changes require recreation.

`startDelay` defaults to `0` seconds. Following Defold, the delay is checked before advancing each frame: the frame reaching the delay still waits, and the next frame emits. Delay overshoot contributes to the duration clock. Loops do not repeat the delay; reset does. Like duration, it is a structural setting rather than a runtime parameter patch.

### Start offset / prewarm

`startOffset` defaults to `0` seconds. Following [Defold StartInstance and FastForwardEmitter](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L313-L324), prewarm runs full 1/60-second steps, capped at the maximum particle lifetime (`initial.lifetime` for our current scalar configuration). Offsets below 0.0001 seconds are ignored. The last step is not shortened, and the prewarm timer uses float32 accumulation like Defold.

Prewarm includes start delay and normal once/loop timing. A once emitter can finish emission during prewarm, leaving only its surviving particles. The simulation advances on the GPU, including position, velocity, age, spawn carry, and random sequence; there is no particle readback.

Reparticle applies prewarm before the first positive `update`, after you have set the emitter position. `update(0)` does not consume it. `reset()` clears the simulation and schedules prewarm again at the current position. The normal update runs after the prewarm steps. Changing start offset requires recreation.

Prewarm has a one-time startup cost proportional to the simulated steps and allocated capacity. `EmitterPlayback` and `prewarm` expose the shared timing logic.

### Size over lifetime

`initial.size` is the particle's initial size in local units (longest edge, preserving texture aspect ratio). It defaults to `24`. Runtime updates affect future births only; existing particles retain their stored initial size. The procedural circle uses the same sizing as textured particles.

`overLifetime.scale` multiplies initial size using normalized particle age: `0` at birth and `1` at death. It defaults to constant `1`. This follows Defold's **Initial Size × Life Scale** model. A number supplies a constant multiplier; a curve supplies points:

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

Like Defold, curves are baked into 64 linear segments. Pixi uploads the 65 endpoint samples once when creating a view and evaluates the curve in the vertex shader. Initial size occupies the third properties channel, with no extra simulation pass or readback. Curve changes require recreation.

This implements scalar initial size and lifetime scale. Initial-size spread, emitter-time size curves, and automatic animated-frame sizing remain separate features. The former `ParticleEffect.particleSize` renderer override is replaced by `initial.size` in configuration or `emitter.setParameters`.

References: [Defold particle properties](https://defold.com/manuals/particlefx/#keyable-emitter-properties), [Hermite curve sampling](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L120-L175), and [64-segment resolution](https://github.com/defold/defold/blob/dev/engine/particle/src/particle_private.h#L27).

### Alpha over lifetime

`initial.alpha` and `overLifetime.alpha` both default to `1`. Alpha uses the same constant-or-Hermite-curve JSON format as lifetime scale. Following Defold, particle alpha is `clamp(initialAlpha × lifetimeAlpha, 0, 1)`: factors may be signed or exceed one; clamp occurs after multiplication. Texture alpha and the Pixi object's opacity then multiply this result.

Initial alpha is captured at birth, so `emitter.setParameters({ initial: { alpha: 0.5 } })` only affects new particles. Lifetime curve changes require recreation. Both textured and procedural particles fade with premultiplied RGB and alpha, avoiding bright fringes. Transparent particles still move, age, and count as alive until their lifetime expires.

The properties texel stores `[age, lifetime, initialSize, initialRotation]`; motion and initial RGBA occupy separate texels. Positive lifetime identifies initialized slots. The curve is uploaded once and sampled in the vertex shader alongside size; no extra simulation pass or GPU readback is added.

Reference: [Defold lifetime color evaluation](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L1247-L1270).

### Color over lifetime

`initial.red`, `initial.green`, and `initial.blue` default to `1` (white). `overLifetime.red`, `.green`, and `.blue` each accept a constant or the existing Hermite curve format, defaulting to `1`. As in Defold, every channel is `clamp(initialChannel × lifetimeChannel, 0, 1)`. These are independent RGB multipliers, with no HSV interpolation or extra gamma conversion. Texture RGB is then multiplied by the resulting tint; texture and particle alpha retain correct premultiplied blending. A colored texture still influences the result—use a white texture or procedural circle to see the tint directly.

Initial RGB changes through `setParameters` affect future births only. Existing particles retain their initial values; curve changes require recreation. The procedural circle now uses the configured RGB directly, replacing its old hardcoded mint color.

Initial RGB needs an additional RGBA texel per slot: motion, properties, and `[initialRed, initialGreen, initialBlue, initialAlpha]`. This raises state texture storage and simulation output from 32 to 48 bytes per allocated slot per texture (50% more). The kernel still runs once per step; no extra pass or readback is introduced. RGBA lifetime samples are packed into 65 `vec4` uniforms alongside the size samples and uploaded only at view creation, staying within WebGL2's minimum vertex-uniform budget.

Reference: [Defold per-channel lifetime multiplication and clamp](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L1247-L1270). Initial-color spread and emitter-time color curves remain pending.

### Rotation over lifetime

`initial.rotation` is captured at birth in degrees, defaulting to `0`. `overLifetime.rotation` is a constant or Hermite curve of additional degrees over normalized particle age, also defaulting to `0`. Defold combines these as **initial rotation + lifetime rotation**, not a multiplier or accumulated angular velocity. Values are not wrapped or clamped, so negative angles and multiple turns work.

Positive angles rotate counterclockwise, matching Defold's positive Z rotation; the shader accounts for canvas Y pointing downward. It rotates the sized, aspect-correct quad around the particle center before applying the Pixi object's transform. It does not rotate the particle's velocity. Initial rotation updates affect future births only; curve changes require recreation.

Initial rotation occupies the fourth properties channel, so storage remains three texels per particle. Curves upload once, and rotation is evaluated in the vertex shader without another simulation pass or readback. This implements Defold's default particle orientation; initial/movement-direction alignment, angular velocity, rotation spread, and emitter transforms remain separate features.

References: [Defold initial rotation](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L991-L1012) and [lifetime rotation](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L1301-L1308).

The internal storage bands use the same names throughout the runtime:

```text
motion:     [x, y, velocityX, velocityY]
properties: [age, lifetime, initialSize, initialRotation]
color:      [initialRed, initialGreen, initialBlue, initialAlpha]
dynamics:   [active, spreadFactor, initialAngularVelocity, accumulatedRotation]
geometry:   [initialStretchX, initialStretchY, initialHandedness, movementRotation]
```

Movement-direction orientation uses the velocity before each step's forces, as in
Defold. Births include transformed spawn velocity and inheritance. The geometry
row stores that heading in degrees; Pixi adds initial and lifetime rotation.
Stopped particles use only those rotation offsets on the next positive step.
Paused rendering retains the captured heading. No extra texture or GPU readback
is required.

`initial` means the value captured for that particle at spawn, not the emitter's current setting. These storage names are Reparticle's; “Initial” follows the configuration and Defold editor terminology.

### Playback and completion

```ts
import type { ParticleStateListener } from '@reparticle/pixi';

const onStateChange: ParticleStateListener = ({ emitterId, state, awakeEmitters }) => {
  console.log(emitterId, state);
  if (state === 'sleeping' && awakeEmitters === 0) {
    console.log('Effect finished');
  }
};
view.on('statechange', onStateChange);

view.play(); // restart all emitters, including delay and prewarm
view.stop(); // stop spawning; let existing particles finish
view.stop({ clear: true }); // stop and remove particles immediately
view.clear(); // shorthand for stop({ clear: true })
view.getEmitter('sparks').stop(); // control one emitter
view.off('statechange', onStateChange);
```

States follow Defold's `prespawn → spawning → postspawn → sleeping` lifecycle.
A stopped emitter can skip spawning. Loops stay in `spawning` until stopped.
Continue calling `update()` after stopping so particles can drain and sleeping can
be reported. Clearing removes particles immediately; sleeping is reported on the
next positive update, including when stopped during start delay. `view.isSleeping`
and `view.awakeEmitters` expose effect completion; each core emitter exposes `state`
and `onStateChange()`. Subscriptions report changes, not an initial snapshot.

Advance particles before rendering. Calling particle playback, update, clear,
texture replacement, or destruction from a render/filter callback throws before
changing GPU state. This also protects direct `view.emitter` simulation operations.
Nested calls to the same renderer's `render()` are rejected. State-change listeners
run after simulation restores Pixi's state, so they may render synchronously.

Construction still starts playback automatically for compatibility. `play()`
restarts this effect's existing simulations, clearing old particles; it does not
allocate overlapping playback instances. `reset()` retains its previous restart
behavior and manual emission gate; `play()` also enables that gate. Pausing means
skipping updates, whereas stopping lets particles continue moving. The composed
example is selected with the **Multi-emitter** dropdown option.

### Automatic frame sizing

```ts
view.setTexture({ textures: smokeFrames, sizeMode: 'auto', fps: 30 });
// For composed effects: view.setEmitterTexture('smoke', { textures: smokeFrames, sizeMode: 'auto' });
```

`sizeMode` belongs only to Pixi texture options and defaults to `'manual'`.
Manual flipbooks keep one aspect ratio across frames, using the first authored
frame's original size by default (including backward playback). To supply the
animation's reference dimensions explicitly, use `animationSize: { width: 64, height: 32 }`
in the animation texture options. Both dimensions must be finite and positive.
These dimensions also determine pivot scaling in either size mode; they are validated by Pixi and are absent from core configuration.
Following Defold, `'auto'` uses the current frame's original dimensions for
animations with multiple frames and playback other than `'none'`. Initial size,
its curve and spread are ignored; lifetime scale and stretch still apply.
Single frames, playback `'none'`, and procedural particles
retain manual sizing. FPS zero freezes the first frame but retains Auto sizing.
Trimmed frames keep their original extent and trim offset; atlas rotation does not
swap particle dimensions. Dimensions use Pixi's logical texture units, independent
of renderer device pixel ratio. Switching modes affects existing particles without
restarting the simulation.

### Artwork flipping

```ts
view.setTexture({ textures: smokeFrames, flipX: true, flipY: false });
view.setEmitterTexture('sparks', { textures: [atlas.textures.spark], flipY: true });
```

`flipX` and `flipY` are optional booleans in Pixi texture configuration, both
false by default. They mirror artwork in particle-local axes before rotation,
without changing motion, orientation, size, or pivot translation. Trim offsets
mirror inside the original frame extent; packed atlas rotation is respected.
They work with static textures and every animation playback/size mode. Changes
apply to living particles while paused; omitting the flags on the next texture
selection resets them. Procedural circles are symmetric, so flipping has no visible
effect. No core fields, GPU readbacks, or extra draw passes are required.

### Particle pivot

```ts
view.setTexture({ textures: [atlas.textures.leaf], pivot: { x: 0, y: 0.5 } });
```

Pivot is a Pixi texture option, defaulting to `{ x: 0, y: 0 }` (center).
It follows Defold's geometry-offset convention: positive X shifts the artwork
right and positive Y shifts it up. In manual mode, `y: 0.5` places the bottom edge
at the particle position. Values are finite and may lie outside the image.
The offset follows particle rotation, orientation, lifetime scale and stretch.
Trimmed frames use their original extent, not the cropped rectangle.

Defold's Auto mode applies pivot against the animation's base aspect without
multiplying by frame dimensions or initial size; `0.5` is therefore **not** a
half-frame anchor in Auto mode. Switching options changes living particles,
including while paused, without touching simulation state. Omitting pivot on a
later texture selection restores the center.

To finish the current emission cycle instead of stopping births immediately:

```ts
view.retire(); // every emitter finishes its own current cycle
view.getEmitter('smoke').retire(); // or just one emitter
```

Retirement follows Defold: it disables the next loop without changing the current
clock or state. The boundary frame still emits, then reports `postspawn`, followed
by `sleeping` when particles expire. During start delay it waits and runs one cycle;
a once emitter keeps its normal schedule. Calling it after a loop has wrapped
finishes the new cycle. `play()`/`reset()` cancel retirement; `stop()` and `clear()`
still stop immediately. Continue updating to finish and receive notifications.

### Authored emitter position

Each emitter accepts `"position": { "x": -24, "y": 12 }` in effect JSON, defaulting
to zero. Position is relative to the effect origin in simulation units (canvas Y
down), independent of the emitter's own rotation and scale.

`emitter.x` / `emitter.y` read and edit this same position. You can also use
`emitter.setParameters({ position: { x: 40 } })`; omitted axes stay unchanged.
Configuration snapshots include the current position. Reset/play preserve it.
World-space particles retain their birth positions when the emitter moves; local
particles follow the emitter through the existing local-space renderer transform.

The composed demo loads three separate origins from JSON and positions the
whole effect through its Pixi parent hierarchy. Moving the Pixi display object now drives simulation motion and inherited velocity
automatically.

### Attach particles to a moving object

```ts
rocket.addChild(view);
view.position.set(0, 30); // emitter effect offset inside the rocket

// Each frame: move the rocket first, then advance particles.
rocket.x += speed * seconds;
view.update(seconds);
```

ParticleEffect automatically reads the current Pixi parent hierarchy before
simulation. World-space particles stay behind; new births follow the rocket.
Local-space particles follow the current hierarchy, including while paused.
Position, rotation, uniform scale (including X/Y flips) and pivot offsets compose normally through
nested parents. Inherited velocity includes movement of each transformed emitter
origin. No consumer effectTransform synchronization is needed or exposed.

Use normal Pixi units and angles (`rotation` in radians, `angle` in degrees).
Move parents before calling update. Drawing does not advance simulation. Reset/play
preserve the scene transform and clear velocity history. World particles use global
scene coordinates, so later parent/camera-container movement also leaves them
behind. Negative scales work on the view and its parents:

```ts
rocket.scale.x = -1; // mirror the rocket and future world-space births
view.scale.y = -1; // mirror the effect vertically
```

Existing world particles keep their birth reflection, size and orientation. Local
particles follow flips immediately, including while paused. Texture artwork,
pivots, motion, spin and modifier directions are reflected together.
The composed scene transform still requires equal scale magnitudes on both axes
(e.g. `(-2, 2)`); unequal scaling and skew throw a descriptive error.

Core-only users can still share an `EffectTransform` across emitters through the
fourth constructor argument. Pixi manages this runtime transform internally.

## Per-emitter rendering tint

Tint belongs to each emitter’s shared `rendering` data:

```ts
effect.emitters[0].rendering = {
  tint: { red: 1, green: 0.8, blue: 0.5, alpha: 1 },
};
const particles = new ParticleEffect(effect, { ticker: app.ticker });
particles.setEmitterTint('fire', { red: 0.5, green: 1, blue: 1, alpha: 0.4 });
particles.getEmitterTint('fire'); // Independent RGBA snapshot.
particles.resetEmitterTint('fire'); // Restore the authored tint, not necessarily white.
```

Tint multiplies the emitter's existing particle color immediately on the next render,
including living particles while simulation is paused. All channels must be finite;
values are not clamped. Texture changes and simulation resets retain the override.

## Pixi filters, masks, and render textures

`ParticleEffect` uses Pixi’s active render target, projection, filter offset and mask
state. Filters and masks can be assigned to the view or its parent, including
nested combinations. These are Pixi settings, not core effect JSON properties.

```ts
import { BlurFilter, Graphics, Rectangle, RenderTexture } from 'pixi.js';

// Caller-owned local capture area: include all particles you want to filter.
view.filterArea = new Rectangle(-300, -300, 600, 600);
view.filters = [new BlurFilter({ strength: 4 })];

const mask = new Graphics().circle(0, 0, 200).fill(0xffffff);
container.addChild(mask);
view.mask = mask;

const target = RenderTexture.create({ width: 800, height: 600, resolution: 2 });
renderer.render({ container, target, clear: true });
```

Set `filterArea` on whichever object owns the filters, including a filtered parent.
For bounds-based capture, supply the inherited `addBounds` callback before first
render, for example `view.addBounds = bounds => bounds.addFrame(-300, -300, 300, 300)`.
This supplies local bounds without inspecting particles. World-space
trails may extend beyond the emitter, so allow for their full extent. No automatic
bounds, hit areas, particle scanning or GPU readbacks are introduced. Filters add
the render passes and temporary targets that Pixi normally requires.

Simulation updates remain explicit. Rendering to several targets does not advance
particles. Pixi’s render-transform override changes the drawing projection without
changing the emitter’s simulation transform. Destroy caller-owned filters, masks
and render textures according to their normal Pixi ownership rules.

### Renderer-free construction

`new ParticleEffect(effect, runtimeOptions)` validates configuration and creates CPU emitter controls without a renderer. Importing `@reparticle/pixi` registers its WebGL particle pipe with Pixi. On the first render, the pipe attaches the renderer’s shared context and prepares GPU.js before Pixi binds the render target.

Emitter access, parameter changes, texture/tint changes, and playback controls work immediately. `update(seconds)` validates its input but does not advance playback until that first render; it does not queue elapsed time. Afterwards, updates run independently of rendering, including when the view is offstage. Start offset/prewarm runs on the first positive update after initialization. GPU texture access before initialization throws.

A view stays attached to its first renderer: transferring live GPU state between contexts is unsupported. Destroying the view releases its resources; destroying the renderer also destroys its attached particle views. Caller-owned artwork is preserved.

### Shared GPU texture sources

Pixi wraps GPU.js output textures with `ExternalSource` and binds them through `Shader.resources`, alongside artwork and animation-frame metadata. Each kernel output gets one reusable wrapper on first use; paused draws and subsequent alternating updates reuse it. No pixel upload, copy, or readback is needed for simulation textures. Destroying a wrapper does not delete its borrowed texture; GPU.js retains ownership. Missing artwork and animation metadata bind Pixi’s empty texture.

### Automatic and manual updates

Effects default to `autoUpdate: true` on `Ticker.shared`. Pass `ticker: app.ticker`
to follow your application's clock. Automatic updates preserve `ticker.deltaMS / 1000`,
splitting deltas above 0.1 seconds into equal steps within core's limit. This also
handles ticker speed scaling. They run at normal priority, before Pixi's application
render listener. Manual `update(seconds)` calls still require a value from 0 to 0.1.

For your own simulation loop, pass `autoUpdate: false` and call
`effect.update(seconds)` explicitly. Do not also advance an automatically updated
effect manually, or it will advance twice. The demo uses automatic updates.

Both `effect.autoUpdate` and `effect.ticker` can change at runtime. Switching
tickers transfers the listener; disabling automatic updates or destroying the
effect removes it. The effect never destroys its ticker. Updates still wait for
the first render to initialize GPU resources.

### Effect data and renderer assets

Core validates each emitter's `rendering` settings: `blendMode` and optional RGBA
`tint`. Artwork is supplied separately through Pixi options, keyed by emitter ID.

```ts
const frames = atlas.animations.smoke;
validateAnimationFrames(frames); // Narrows a loaded Texture[] to two or more frames.
const particles = new ParticleEffect(effectConfig, {
  emitters: {
    smoke: { textures: frames, playback: 'loop-forward', fps: 24 },
    sparks: { textures: [sparkTexture] },
  },
  ticker: app.ticker,
  autoUpdate: true,
});
```

One texture is static. Two or more enable animation settings; empty or invalid supplied arrays use a shared missing-texture placeholder and log a warning. Omitted artwork uses procedural particles. Animation frames must share
one texture source. Pixi borrows textures and never destroys them with the effect.
Sizing, pivot, flips, animation size, playback and FPS belong to Pixi bindings.
`validateAnimationFrames` is exported by `@reparticle/pixi` for loaded arrays.

`EffectInput` and `EmitterInput` describe authoring data; `EffectConfig` and
`EmitterConfig` include parsed defaults. Use `parseEffectConfig(json)` for untrusted
JSON. Runtime `setTexture({ textures: [texture] })` and `setEmitterTexture(id, options)`
replace artwork without changing core configuration. Use `setEmitterBlendMode`
and `setEmitterTint` for live appearance overrides.
