# Particle architecture and implementation roadmap

Reparticle targets full coverage of Defold's documented particle capabilities, implemented and verified one feature at a time. Consumers provide versioned JSON and supported runtime parameter updates. All simulation functions are authored inside Reparticle. The editor follows after the runtime contract is established.

This is capability coverage, not a promise of Defold file compatibility or numerically identical output. Defold file importing and exact simulation compatibility require separate decisions. New findings extend the backlog rather than silently reducing the target.

## Architecture decisions

Keep the existing core and Pixi packages. Within core, separate configuration validation, emission scheduling, particle lifecycle, built-in mathematical behaviors, and GPU.js storage/execution. These responsibilities do not require new packages.

The configuration boundary uses strict Zod schemas to validate unknown input before GPU allocation and produce typed owned data. Configuration types live in `src/types` and are inferred from the schemas. Parsing throws a `ZodError` with structured issue paths; callers can use the exported schema with `safeParse` instead. Runtime updates use a restricted typed API. Never evaluate consumer code, generate functions from JSON, or traverse configuration per particle per frame.

Core has no Pixi dependency. GPU.js remains the simulation backend. Pixi owns visual output and resolves asset identifiers through the host. Host texture objects do not belong in JSON. Shared GPU textures remain resident; normal playback must not read particle state back to the CPU.

Keep ordinary typed kernel functions and explicit helper registration. There is no kernel generator or consumer build plugin. Avoid block-local names that minifiers can shadow against GPU function parameters. Test kernels after production minification.

Capacity is explicit. No automatic bounds, hit-area calculation, particle scanning, or hidden CPU fallback. Consumers supply bounds and hit areas. Resource destruction respects the renderer's ownership of the shared GL context.

## Definition structure

An effect owns named emitters and, eventually, shared modifiers. Each emitter owns emission settings, initial particle properties, properties over particle lifetime, local modifiers, and rendering settings. IDs address emitters and modifiers in runtime updates; JSON property order never sets execution order.

Two timelines are distinct: emitter elapsed time controls emission and the initial values of newly born particles; normalized particle age controls changes throughout an individual particle's lifetime. Lifetime is sampled at birth. Aging and expiration are mandatory lifecycle logic, not optional behaviors.

Modifiers accumulate acceleration before movement integration. The integration policy must be documented and tested as each modifier arrives. Preserve the current constant-acceleration position term when extracting gravity. Multiple modifiers must not accidentally integrate position multiple times.

The first JSON skeleton is [effect.example.json](effect.example.json). It is accepted by `parseEffectConfig` and loads through `ParticleView(renderer, definition)` or the core `Emitter` constructor after parsing. Unsupported fields, shapes, versions, and multiple emitters fail explicitly.

Current required fields have no implicit defaults:

| Field               | Meaning and constraints                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| version             | Exactly 1 for this initial contract                                                               |
| emitters            | Exactly one entry until orchestration is implemented; the document shape supports later expansion |
| id                  | Nonempty string; future multiple-emitter definitions must have unique IDs                         |
| capacity            | Integer 1 through 1000000; device texture limits are checked at creation                          |
| seed                | Integer 0 through 65535; reproducibility across different GPU drivers is not promised             |
| emission.rate       | Finite nonnegative particles per second                                                           |
| emission.shape.type | `point`, `circle`, `box`, or `cone2d`                                                             |
| initial.lifetime    | Finite positive seconds                                                                           |
| initial.speed       | Finite nonnegative units per second                                                               |
| initial.direction   | Finite radians; used by point spawning                                                            |
| initial.spread      | Finite nonnegative angular width for point spawning                                               |
| modifiers.gravity   | Required object: x must currently be zero; y is finite acceleration in units/second²              |

Simulation coordinates currently use local units, positive X right and positive Y down. Rotation and angular speed use radians and radians/second in Reparticle. Conversion from other formats belongs at import boundaries.

Version 1 is an unpublished initial contract. Add validated fields as their semantics and execution become available. Once published, incompatible semantic changes require a new version and migration rules. Do not predeclare fields that silently have no effect.

Scalar speed is exact. The prototype's implicit speed variation, shrinking, and fading have been removed. Lifetime scale and alpha now use explicit curves; randomized values remain pending. Initial size belongs to the effect definition; texture remains a renderer control.

## Coverage inventory

Reference: [Defold Particle FX manual](https://defold.com/manuals/particlefx/), reviewed 2026-10-17. The following feature groups are the coverage target; every unchecked group remains planned.

- [ ] Multiple emitters; effect-wide and emitter-local modifiers; IDs and transforms.
- [x] Once/loop playback, duration, draining particles, reset, capacity.
- [x] Start delay (once per start, reapplied on reset).
- [x] Start offset / prewarm.
- [ ] Emitter/world space.
- [x] Circle: uniform disk births, outward radial velocity, numeric diameter.
- [x] Box in 2D: uniform rectangle births, upward velocity, full width/height.
- [x] 2D cone: uniform triangle births, velocity away from the tip, full width/height.
- [ ] Sphere, 3D cone; box depth and remaining shape dimensions.
- [x] Default, initial-direction and movement-direction orientation.
- [ ] Inherited velocity, velocity-aligned stretch.
- [ ] Spawn rate, lifetime, speed, size, RGBA, rotation, stretch, angular velocity; emitter-time curves and random spread.
- [x] Lifetime scale: Hermite curves sampled into 64 linear segments.
- [x] Initial alpha and lifetime alpha (clamp their product to [0, 1]).
- [x] Initial RGB and lifetime RGB curves.
- [x] Initial rotation and lifetime rotation (additive degrees, default orientation).
- [ ] Lifetime stretch and angular velocity curves.
- [ ] Acceleration, drag, radial, vortex; transforms, magnitude, influence distance.
- [ ] Images, atlases, animation, automatic/manual sizing, materials, tint constants.
- [ ] Alpha, additive, multiply, screen blending.
- [ ] Playback and runtime property controls; emitter states and resource limits.
- [ ] Hierarchy editing, property editing, curve editing, live preview, playback controls.

The inventory includes 3D concepts. Our current implementation is 2D; sphere/cone depth, projection, and 3D transforms remain explicit architecture work, not silently flattened substitutes. Material capabilities must be expressed through Reparticle-owned rendering implementations and data; consumer-authored GPU functions remain outside the contract.

Use the [Defold runtime API](https://defold.com/ref/stable/particlefx-lua/) when specifying runtime controls. Verify individual behavior against the relevant manual/API/source before claiming parity. Engine-specific scene deletion, GUI integration, resource formats, and project settings need documented equivalents in a standalone library. Do not copy an undocumented or inconsistent formula without verification.

## Implementation sequence

1. **Configuration boundary — implemented.** Typed versioned definition, strict validation, independent output data, documented JSON fixture, tests outside source using package aliases. No GPU resources are created by parsing.
2. **Connect one emitter — implemented.** The demo creates from JSON. `setParameters` validates atomic numeric patches, and `configuration` returns an independent snapshot. IDs, capacity and seed reach the runtime; scalar speed is exact. Flat prototype options and implicit visual changes are removed. Texture configuration remains in the rendering backlog; initial size is implemented.
3. **Separate lifecycle and acceleration — implemented.** Built-in lifetime helpers own age/activity, gravity contributes acceleration, and motion integrates each axis once using the constant-acceleration position term. Spawn initializes new particles before these stages. Helpers are registered in one GPU update kernel, not separate passes. The JSON is unchanged: horizontal gravity remains zero; numeric gravity updates affect living particles, while initial-property changes affect future births. GPU.js uses an explicitly numeric activity flag because registered boolean-return helpers are unsupported.
4. **Value distributions.** Consistent constant/random representations; independent random channels; lifetime and other initial properties sampled once at birth.
5. **Emitter playback — duration and once/loop implemented.** Remaining: explicit stop/retire APIs and state notifications.
6. **Shapes and transforms — circle, 2D box, and 2D cone implemented.** `circle` takes a finite nonnegative `diameter`; angle is uniform and radius uses square-root sampling. Diameter updates affect future births only; shape type requires recreation. Point direction/spread are point-only. Implement each remaining documented shape separately; coordinate-space rules and inherited velocity; resolve 3D state/rendering needs before claiming 3D shapes.
7. **Curves and particle appearance.** Shared curve contract, emitter-time evaluation, particle-age evaluation; each size/color/rotation/stretch feature separately. Renderer evaluation may avoid storing values derivable from age.
8. **Remaining modifiers.** Drag, radial, vortex individually, with clear ordering and influence rules.
9. **Effect composition.** Multiple emitters, shared modifiers, IDs, ownership and total resource budgets. Never imply an entire multi-emitter effect costs one draw.
10. **Rendering coverage.** Blend modes, orientation, stretch, atlases/animation, sizing, tint and material equivalents, each separately.
11. **Editor.** Defold-inspired workflow backed by the same validated definition. Only expose supported features. No editor-specific simulation logic.

Dependencies may change the order, but no feature disappears from the coverage inventory. Each larger step is split into individual feature changes. The old flat emitter options API has been replaced by the JSON definition and numeric parameter patches.

Circle implementation reference: [Defold SpawnParticle, circle branch](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L905-L915), reviewed 2026-10-17. We match its disk sampling and radial velocity semantics, not its PRNG sequence, emitter transform system, or newborn time integration. Circle diameter corresponds to Defold's Emitter Size X. The existing Reparticle birth-age convention remains unchanged.

## Runtime update policy

| Category                                                     | Policy                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Emission rate, circle diameter, and box/cone dimensions      | Update scheduling without recompilation                                               |
| Initial properties                                           | Affect subsequent births; do not rewrite existing particle state                      |
| Modifier numeric parameters                                  | Affect living particles without recompilation where supported                         |
| Capacity, state layout, behavior structure, simulation space | Explicit rebuild/reset policy; never an implicit expensive hot-path operation         |
| Asset changes                                                | Renderer resolves/rebinds resources; texture upload may occur outside steady playback |

Validate patches atomically. Reject unknown or structural fields on the numeric update API. Changes to configuration do not mutate existing instances by reference.

## Feature completion checks

Every feature needs documented JSON semantics, units, defaults, limits, and runtime-update behavior; invalid-input tests; numerical tests where applicable; and an integration example. Source tests live in package `tests` directories and import through `#src` aliases. The demo always consumes built libraries.

GPU changes additionally require minified browser execution, shared-context correctness, and no playback particle readbacks/uploads. Measure representative mobile workloads when the workload changes; record capacity, emission rate, lifetime, texture, resolution, and device. Do not infer performance from feature parity or unit tests. Plain HTML plus more than one minifier is the portability check for changes to GPU function structure.

Update this roadmap after each completed feature. Temporary diagnostics belong outside the repository; lasting regression coverage belongs in tests.

Box reference: [Defold SpawnParticle box branch](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L973-L984). `width`/`height` correspond to Size X/Y with Z zero. Both are finite and nonnegative; samples cover centered full extents. Velocity is local upward, mapped to negative Y in the current canvas coordinate system. Dimensions affect future births only. Emitter transforms and 3D depth are not implemented.

2D cone reference: [Defold SpawnParticle 2D cone branch](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L941-L971), reviewed 2026-10-17. `cone2d.width`/`height` correspond to Size X/Y. Two uniform samples form a parallelogram; folding its far half creates uniform triangle coverage. Velocity is normalized from the tip to the birth point, with upward fallback at the tip. We map Y to downward-positive canvas coordinates. Zero dimensions follow the same sampling and fallback. Numeric dimension updates affect future births; point direction/spread have no effect. PRNG sequences, emitter transforms, and birth-step aging are not claimed to match Defold.

### Implemented emitter playback

Emitter-level `duration` is finite, nonnegative seconds (default 1); `playMode` is `once` or `loop` (default loop). These are structural settings, not numeric uniform patches. The demo recreates the effect and resets debug counting when they change.

The emitter clock is independent of particle lifetime. Once stops after emitting the duration boundary frame; it does not kill particles. Loop resets its clock at the boundary without clearing particles or resetting emission carry/seed. Zero-duration once runs one positive step; loop continues. Zero-time initialization is deliberately inert. A tiny floating-point tolerance avoids an extra boundary frame from accumulation error. This matches Defold's frame-based playback policy, not bit-identical timer arithmetic or its newborn aging convention.

`emitting` is a manual gate, `isEmitting` combines that gate with the playback state, and reset restarts playback. The manual gate does not freeze elapsed time. Pausing the demo skips both simulation and counting; debug uses emission eligibility captured before the update so the final once frame is counted correctly. No per-particle CPU tracking is added to core.

Reference: [Defold UpdateEmitterState](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L785-L844). Duration spread, timeline curves, and lifecycle callbacks remain pending.

Start delay: `startDelay` is finite and nonnegative, defaults to zero, and is structural. Defold checks the existing timer against the delay before adding the current step. The crossing step does not emit; the next step emits its full frame, carrying any delay overshoot into the duration timer. Loop wrap does not reenter the waiting state. Reset restores the delay, and zero-time warmup does not consume it. The pre-step emission eligibility used by demo stats follows the same boundary. Reference: [Defold UpdateEmitterState](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L785-L844).

Start offset: `startOffset` is a finite nonnegative structural setting, default zero. Match Defold StartInstance: ignore offsets below 0.0001 and clamp simulated time to maximum particle lifetime (currently scalar `initial.lifetime`). Fast-forward in full float32 1/60-second steps with float32 elapsed accumulation, including delay and once/loop transitions. The last step is not shortened. Reparticle defers this work until the first positive update so consumers can position an emitter before its world-space particles are born. Reset queues it again; zero-time kernel warmup does not consume it. The debug overlay replays the shared timing utilities independently, keeping counting out of core. Reference: [Defold StartInstance](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L407-L429) and [FastForwardEmitter](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L313-L324).

Size over lifetime is implemented as `initial.size` (default 24, captured at birth) multiplied by `overLifetime.scale` (default 1). Scale accepts a constant or `{ points: [{ time, value, tangent }] }`. Tangents are slopes equivalent to Defold ty/tx; Hermite interpolation is sampled into 64 linear segments, matching Defold PROPERTY_SAMPLE_COUNT. Time is normalized particle age, not emitter time. Core owns schema and curve math, and stores initial size in the properties texel's third channel. Pixi uploads the sampled curve once and evaluates it in its vertex shader, retaining texture aspect ratio. No texture expansion, extra simulation kernel, CPU particle state, or per-frame curve upload is required. Runtime initial-size updates affect future births only; curve edits require recreation. Initial-size spread, emitter-time size curves and automatic animated-frame sizing remain pending.

Alpha over lifetime: `initial.alpha` and `overLifetime.alpha` default to 1. The latter uses the shared constant/Hermite curve schema and 64-segment sampling. Following Defold, clamp only the product of captured initial alpha and lifetime alpha to [0, 1], before multiplying texture and object opacity. Pixi scales premultiplied RGB and alpha together for both textured and procedural rendering. Initial alpha shares the color texel with initial RGB; positive lifetime captured at spawn identifies active storage. Transparent particles remain simulated and counted. Initial alpha is a numeric parameter for future births; lifetime curves remain structural. No texture growth, readback, extra pass, or per-frame curve upload.

Color over lifetime: initial red/green/blue and lifetime red/green/blue default to 1. Each channel follows Defold's clamp(initial × lifetime, 0, 1), then tints texture RGB without additional color-space conversion. Initial numeric updates affect new births, lifetime curves require recreation. Captured RGB occupies a third RGBA texel `[initialRed, initialGreen, initialBlue, initialAlpha]`, raising texture storage and update output by 50% (32 to 48 bytes per slot per texture), still in one simulation pass. GPU texture-height validation now accounts for all three row bands. RGBA curves share one array of 65 vec4 samples to stay within minimum WebGL2 vertex-uniform limits; samples upload once. The procedural circle has a white base, so its color comes entirely from configured RGB. Initial color spread and emitter-time color curves remain pending.

Rotation uses `initial.rotation` plus `overLifetime.rotation`, both degrees and default zero. Initial rotation is stored in the fourth properties channel, making the properties band `[age, lifetime, initialSize, initialRotation]`; texture storage is unchanged. Lifetime rotation uses the shared 64-segment Hermite sampling and is an absolute additive offset, not angular velocity. Positive angles rotate counterclockwise after accounting for downward canvas Y. Pixi rotates the aspect-correct quad around its center before applying the object transform, leaving simulation velocity unchanged. Initial degree updates affect future births, curve edits require recreation. `orientation` defaults to `"default"`; `"initial-direction"` aligns local up to the shape's spawn direction, then adds initial rotation and lifetime rotation. Alignment is captured at birth even at zero speed and remains fixed when gravity changes velocity. Box points up, circle points radially outward (including zero diameter), and Cone2D points away from its tip with an up fallback at zero length. Reparticle's extra point shape uses its sampled direction/spread. Orientation edits require recreation. The stored `initialRotation` includes this alignment. `"movement-direction"` instead aligns to current velocity in the render shader, adding the captured initial rotation and lifetime offset. It follows gravity-induced turns. As in Defold, squared speed must exceed `0.0001`; otherwise only the rotation offsets apply, with no retained heading. Directions nearly opposite local up use Defold's half-turn fallback (`abs(upDot + 1) <= 0.0001`). No extra texture channels or CPU readback are needed. Angular velocity, rotation spread and emitter transforms remain pending.

Storage terminology: `motion` is `[x, y, velocityX, velocityY]`, `properties` is `[age, lifetime, initialSize, initialRotation]`, and `color` is `[initialRed, initialGreen, initialBlue, initialAlpha]`. Initial values belong to each particle and are captured at spawn; later emitter parameter changes do not replace them. These are internal Reparticle names aligned with our JSON and Defold's editor terminology, not Defold's exact internal field names.

Initial speed/lifetime spread uses `initial.speedSpread` and `initial.lifetimeSpread`, both nonnegative absolute half-ranges defaulting to zero. Each property samples a separate signed random offset at spawn: `base + random(-1, 1) * spread`, matching Defold's per-property spread semantics. Sampled negative speed reverses motion; sampled nonpositive lifetime is inactive. Initial-direction alignment still uses the shape direction, while movement-direction alignment follows the resulting signed velocity. Runtime edits affect future births only. Prewarm uses `lifetime + lifetimeSpread` as its maximum lifetime. The deterministic property streams use float32-safe integer arithmetic (not Defold's exact random sequence); the debug overlay mirrors sampled lifetimes without GPU readback. Existing `initial.spread` remains the point shape's full angular spread in radians.

Size and rotation spread use `initial.sizeSpread` (pixels) and `initial.rotationSpread` (degrees), nonnegative absolute half-ranges defaulting to zero. Separate property streams sample `base + random(-1, 1) * spread` once at birth, independently of speed/lifetime and shape sampling. As in Defold, sampled size stays signed (negative size inverts both quad axes), and rotation is not clamped or wrapped. The sampled size multiplies the lifetime scale; sampled rotation adds to orientation and lifetime rotation. Runtime changes affect future births only, including recycled slots. Existing properties texture channels store the sampled values; no extra storage or debug tracking is needed.

Color and alpha spread use `initial.redSpread`, `greenSpread`, `blueSpread`, and `alphaSpread`. Each is a nonnegative absolute half-range defaulting to zero, sampled independently as `base + random(-1, 1) * spread` at birth. Samples are stored unmodified in the existing color texel, including negative values and values above one. Matching Defold, each rendered channel is `clamp(sampledInitial * lifetimeCurve, 0, 1)`; clamping at birth would change the result. Runtime spread edits affect future births only. Transparent particles still simulate and remain counted as alive until their lifetime expires.

`emission.rate` accepts a constant or the shared Hermite curve format, with **absolute particles per second** as values. Curve time is normalized emitter age, not particle age. Rates use 64 sampled linear segments, clamp negative evaluated values to zero, and feed the existing fractional spawn accumulator once per frame. Defold timing applies: advance the clock first, wrap looping boundary frames before sampling, sample the endpoint for a once boundary frame, and use time zero for zero duration. Start delay and prewarm use the same clock and rate sampler. Curve edits require recreation; a numeric `setParameters({ emission: { rate } })` replaces the curve with a constant. Unrelated parameter updates preserve it.

Example emission rate ramp over the emitter's configured duration:

```json
{
  "rate": {
    "points": [
      { "time": 0, "value": 0, "tangent": 4000 },
      { "time": 1, "value": 4000, "tangent": 4000 }
    ]
  },
  "shape": { "type": "point" }
}
```

`initial.speed` accepts a constant or an emitter-time Hermite curve with absolute speed values (pixels/second in the demo). It uses the same cached 64-segment sampling and post-advance emitter clock as spawn rate, including once/loop boundaries, delay, and prewarm. The evaluated speed is passed to the GPU, where each newborn adds its independent `speedSpread` offset. Signed values are preserved: negative speed reverses the shape's direction. Existing particles are not rescaled when the emitter curve changes over time; their stored velocity continues under modifiers. Numeric speed patches replace the curve for future births, while unrelated patches preserve it. Curve changes require recreation. No extra per-particle channels or GPU function changes are needed.

`initial.size` accepts a constant (default 24) or an emitter-time Hermite curve, with absolute size values in pixels in the demo. The emitter evaluates its cached samples at the same normalized age as initial speed and spawn rate; each newborn then adds independent `sizeSpread` and captures that result in `properties.initialSize`. Rendering multiplies the captured size by `overLifetime.scale` evaluated at the particle's own age. Signed samples are preserved, matching Defold. Changing emitter age or numeric initial size does not resize existing particles. Numeric size patches replace the curve for future births; unrelated patches preserve it. The demo distinguishes **Initial size over emitter lifetime** from **Size over particle lifetime**.

`initial.rotation` accepts a constant (default zero) or an emitter-time Hermite curve with absolute degree values. Cached samples use the same post-advance emitter clock as initial size and speed. Each newborn adds its independent `rotationSpread`, then applies initial-direction alignment when selected. The resulting initial rotation is captured in the existing properties channel; later emitter curve values do not rotate existing particles. Rendering adds `overLifetime.rotation` at the particle's own age and, in movement-direction mode, its current velocity heading. Signed and multi-turn values remain unwrapped. Numeric rotation patches replace the curve for future births; unrelated patches preserve it. The demo separates **Initial rotation over emitter lifetime** from **Rotation over particle lifetime**.

`initial.red`, `green`, `blue`, and `alpha` each accept a constant (default one) or an independent emitter-time Hermite curve. Cached samples use the shared post-advance emitter clock. Each newborn adds the corresponding spread and captures its RGBA values in the existing color texel, without clamping. Rendering computes `clamp(capturedChannel * particleLifetimeCurve, 0, 1)`, matching Defold; negative values and values above one must remain intact until this multiplication. Existing particles keep their captured values as emitter time progresses. Numeric channel updates replace only that channel's emitter curve for future births; unrelated updates preserve all curves. Demo selectors distinguish initial channel curves over emitter lifetime from color/alpha over particle lifetime. No extra per-particle storage or debug counting is required.

`initial.lifetime` accepts a constant or an emitter-time Hermite curve in seconds. Each newborn captures the evaluated value plus its independent lifetime spread; existing particles keep their stored expiry time and use that lifetime to normalize all particle-time curves. Nonpositive sampled lifetimes are inactive. Prewarm caps its replay using the maximum of the cached lifetime samples plus spread, including Hermite overshoot between authored points. Debug counting evaluates the same lifetime curve on the same emitter clock and retains each birth's sampled lifetime. Numeric lifetime patches replace the curve for future births; unrelated updates preserve it. Demo controls provide constant, ramp-up, fade-out and authored JSON choices.
