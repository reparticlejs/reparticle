# Particle architecture and implementation roadmap

Reparticle targets Defold's portable particle capabilities, implemented and verified one feature at a time. The current scope is 2D; 3D remains deferred, and engine-specific resource/material systems are outside the Pixi runtime contract. Consumers provide versioned JSON and supported runtime parameter updates. All simulation functions are authored inside Reparticle. The editor follows after the runtime contract is established.

This is capability coverage, not a promise of Defold file compatibility or numerically identical output. Defold file importing and exact simulation compatibility require separate decisions. New findings extend the backlog rather than silently reducing the target.

## Architecture decisions

Keep the existing core and Pixi packages. Within core, separate configuration validation, emission scheduling, particle lifecycle, built-in mathematical behaviors, and GPU.js storage/execution. These responsibilities do not require new packages.

The configuration boundary uses strict Zod schemas to validate unknown input before GPU allocation and produce typed owned data. Configuration types live in `src/types` and are inferred from the schemas. Parsing throws a `ZodError` with structured issue paths; callers can use the exported schema with `safeParse` instead. Runtime updates use a restricted typed API. Never evaluate consumer code, generate functions from JSON, or traverse configuration per particle per frame.

Core has no Pixi dependency. GPU.js remains the simulation backend. Pixi owns visual output and resolves asset identifiers through the host. Host texture objects do not belong in JSON. Shared GPU textures remain resident; normal playback must not read particle state back to the CPU.

Keep ordinary typed kernel functions and explicit helper registration. The package build compiles their source strings into tracked `src/simulation/functions.json`; consumers need no build plugin, source rewriting or minifier configuration. Test kernels after production minification.

Capacity is explicit. No automatic bounds, hit-area calculation, particle scanning, or hidden CPU fallback. Consumers supply bounds and hit areas. Resource destruction respects the renderer's ownership of the shared GL context.

## Definition structure

An effect owns named emitters and shared modifiers. Each emitter owns emission settings, initial particle properties, properties over particle lifetime, local modifiers, and rendering settings. IDs address emitters. Modifier array order sets execution order; object property order does not.

Two timelines are distinct: emitter elapsed time controls emission and the initial values of newly born particles; normalized particle age controls changes throughout an individual particle's lifetime. Lifetime is sampled at birth. Aging and expiration are mandatory lifecycle logic, not optional behaviors.

Modifiers change velocity sequentially in authored array order: emitter-local entries first, then shared effect entries. Living-particle position advances once using the resulting velocity, as in Defold. Newborns age by the full simulation step and advance from their sampled birth position using the modified velocity, as in Defold.

The first JSON skeleton is [effect.example.json](effect.example.json). It is accepted by `parseEffectConfig` and loads through `ParticleView(definition)` or the core `Emitter` constructor after parsing. Unsupported fields, shapes, and versions fail explicitly. Effects accept one or more emitters with unique IDs.

The required fields are `version`, the nonempty `emitters` list, and each emitter's
`id`, `capacity`, `seed`, `emission.rate`, `emission.shape`, `initial.lifetime`,
`initial.speed`, `initial.direction` and `initial.spread`. Shapes other than `point`
also require their dimensions. Other defaults and accepted runtime patches are
specified by `packages/core/src/config/schemas/definition/effect.ts`; do not duplicate the schema as
an outdated required-field table here. Scalar properties can be constants or
curves; spreads are explicit. Signed speed, size and sampled lifetime values are
supported by their runtime semantics.

Coordinates use logical units, positive X right and positive Y down. Particle,
emitter and modifier rotations use counterclockwise degrees; angular velocity is
in degrees/second. Point-emission `initial.direction` and `initial.spread` use
radians. Pixi display transforms retain Pixi's own angle conventions. Device pixel
ratio affects rendering resolution, not simulation units.

Version 1 is an unpublished initial contract. Only accept fields that execute a
defined behavior. Texture assets, animations, sizing mode, pivot and tint belong
to the Pixi configuration, separate from the core effect definition.

## Coverage inventory

Audited 2026-10-19 against Defold 1.13.2. See the [2D audit](defold-2d-audit.md) for
pinned source references, local evidence, confirmed differences and scope decisions.
Checked entries mean the capability exists; they do not claim exact numerical
parity or supersede the open corrections below.

### Implemented portable 2D runtime

- [x] Multiple named emitters; emitter position/rotation; local and shared ordered modifiers, including repeated types.
- [x] Once/loop, duration and duration spread, start delay and spread, start offset/prewarm.
- [x] Play/restart, stop/drain, clear, retire after the current loop, lifecycle state notifications.
- [x] Explicit capacity, preservation of living particles, dropped excess births, expiration and Defold-style logical draw ordering/ties.
- [x] World/local emission space, inherited velocity and automatic Pixi hierarchy synchronization.
- [x] Circle, 2D box and 2D cone; emitter-size curves and spread. Point emission is an additional Reparticle shape.
- [x] Default, initial-direction, movement-direction and angular-velocity orientation.
- [x] Spawn-rate curves/spread; initial lifetime, speed, size, RGBA, rotation, stretch X/Y and angular velocity curves/spread.
- [x] Particle-lifetime scale, RGBA, rotation, stretch X/Y and angular-velocity curves; velocity-dependent stretch.
- [x] Hermite property curves sampled into 64 linear segments.
- [x] Acceleration, directional/general drag, radial and 2D vortex; magnitude curves/spread, transforms and constant influence distance.
- [x] Pixi texture/atlas frames with trim and packed rotation; single-source flipbook playback and runtime image/animation replacement.
- [x] Manual/automatic animation sizing and particle pivot.
- [x] Alpha, additive, multiply and screen blending; runtime per-emitter tint/reset.
- [x] Pixi-specific integration: nested transforms, equal-magnitude signed axis scales, filters, masks and render textures.

### Open compatibility corrections

- [x] Movement-direction heading uses the velocity at Defold's pre-modifier evaluation point, including births.
- [x] Modifier curves use authored-duration timing, including final-segment extrapolation when duration spread extends playback.
- [x] Manual flipbook size uses animation-level aspect rather than each frame's aspect.

### Missing asset and authoring capabilities

- [x] Artwork-only `flipX` / `flipY` in Pixi texture options, for static frames and animations.
- [ ] Flipbook frames spanning multiple texture sources / atlas pages.
- [ ] Full editor: hierarchy, property/curve authoring, modifier gizmos, persistence and live preview workflow. The demo is not this editor.
- [ ] Committed browser conformance fixtures for renderer behavior; previous temporary GPU checks are not a repository regression suite.

### Deferred or outside the current contract

- **3D deferred:** sphere, 3D cone, box depth, 3D transforms/orientation and out-of-plane vortex axes.
- **Engine-specific:** Defold material resources, custom material attributes/constants, resource loaders, render predicates, Lua/GUI messaging and project-wide engine budgets. Tint and blend equivalents are already implemented. No dissolve-material feature is implied.
- **Intentional API differences:** `play()` restarts one owned simulation instead of allocating overlapping instances; destruction releases that simulation. Separate views represent overlapping effects.
- **Representation differences:** own seed streams, local emitter coordinates, explicit Pixi transform semantics and a versioned JSON format. No Defold-file importer or bitwise-identical simulation promise.

## Next implementation sequence

The original runtime feature sequence is implemented at capability level. Finish
the two remaining compatibility corrections above, one at a time, with focused reference
cases. Asset expansion and the editor remain separate work. The [audit](defold-2d-audit.md#next-work)
explains the recommended order; do not infer new simulation features from stale
unchecked groups or engine-only Defold settings.

Circle implementation reference: [Defold SpawnParticle, circle branch](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L905-L915), reviewed 2026-10-17. We match its disk sampling and radial velocity semantics, not its PRNG sequence. Circle diameter corresponds to Defold's Emitter Size X. Newborn movement and aging now use the full simulation step, as described below.

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

The emitter clock is independent of particle lifetime. Once stops after emitting the duration boundary frame; it does not kill particles. Loop resets its clock at the boundary without clearing particles or resetting emission carry/seed. Zero-duration once runs one positive step; loop continues. Zero-time initialization is deliberately inert. A tiny floating-point tolerance avoids an extra boundary frame from accumulation error. This matches Defold's frame-based playback policy, not bit-identical timer arithmetic. Newborn aging follows the full-step behavior described below.

`emitting` is a manual gate, `isEmitting` combines that gate with the playback state, and reset restarts playback. The manual gate does not freeze elapsed time. Pausing the demo skips both simulation and counting; debug uses emission eligibility captured before the update so the final once frame is counted correctly. Core now tracks slot allocation and lifetime for capacity and ordering; particle motion remains on the GPU.

Reference: [Defold UpdateEmitterState](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L785-L844). Duration spread, timeline curves, and lifecycle callbacks were added in subsequent steps below.

Start delay: `startDelay` is finite and nonnegative, defaults to zero, and is structural. Defold checks the existing timer against the delay before adding the current step. The crossing step does not emit; the next step emits its full frame, carrying any delay overshoot into the duration timer. Loop wrap does not reenter the waiting state. Reset restores the delay, and zero-time warmup does not consume it. The pre-step emission eligibility used by demo stats follows the same boundary. Reference: [Defold UpdateEmitterState](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L785-L844).

Start offset: `startOffset` is a finite nonnegative structural setting, default zero. Match Defold StartInstance: ignore offsets below 0.0001 and clamp simulated time to maximum sampled initial-lifetime curve value plus lifetime spread. Fast-forward in full float32 1/60-second steps with float32 elapsed accumulation, including delay and once/loop transitions. The last step is not shortened. Reparticle defers this work until the first positive update so consumers can position an emitter before its world-space particles are born. Reset queues it again; zero-time kernel warmup does not consume it. The debug overlay replays the shared timing utilities independently, keeping the debug display separate from core allocation bookkeeping. Reference: [Defold StartInstance](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L407-L429) and [FastForwardEmitter](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp#L313-L324).

Size over lifetime is implemented as `initial.size` (default 24, captured at birth) multiplied by `overLifetime.scale` (default 1). Scale accepts a constant or `{ points: [{ time, value, tangent }] }`. Tangents are slopes equivalent to Defold ty/tx; Hermite interpolation is sampled into 64 linear segments, matching Defold PROPERTY_SAMPLE_COUNT. Time is normalized particle age, not emitter time. Core owns schema and curve math, and stores initial size in the properties texel's third channel. Pixi samples the curve once and evaluates it in its vertex shader, retaining texture aspect ratio. The per-emitter uniform group syncs these samples when drawing with the shared program. No texture expansion, extra simulation kernel, or CPU particle state is required. Runtime initial-size updates affect future births only; curve edits require recreation. Initial-size spread, emitter-time size curves and automatic animated-frame sizing were added in subsequent steps below.

Alpha over lifetime: `initial.alpha` and `overLifetime.alpha` default to 1. The latter uses the shared constant/Hermite curve schema and 64-segment sampling. Following Defold, clamp only the product of captured initial alpha and lifetime alpha to [0, 1], before multiplying texture and object opacity. Pixi scales premultiplied RGB and alpha together for both textured and procedural rendering. Initial alpha shares the color texel with initial RGB; an explicit active flag identifies live storage. Transparent particles remain simulated and counted. Initial alpha is a numeric parameter for future births; lifetime curves remain structural. No texture growth, readback, extra pass, or per-frame curve upload.

Color over lifetime: initial red/green/blue and lifetime red/green/blue default to 1. Each channel follows Defold's clamp(initial × lifetime, 0, 1), then tints texture RGB without additional color-space conversion. Initial numeric updates affect new births, lifetime curves require recreation. Captured RGB occupies a third RGBA texel `[initialRed, initialGreen, initialBlue, initialAlpha]`, raising texture storage and update output by 50% (32 to 48 bytes per slot per texture), still in one simulation pass. GPU texture-height validation now accounts for all three row bands. RGBA curves share one array of 65 vec4 samples to stay within minimum WebGL2 vertex-uniform limits; samples are reused and synced through each emitter’s uniform group. The procedural circle has a white base, so its color comes entirely from configured RGB. Initial color spread and emitter-time color curves remain pending.

Rotation uses `initial.rotation` plus `overLifetime.rotation`, both degrees and default zero. Initial rotation is stored in the fourth properties channel, making the properties band `[age, lifetime, initialSize, initialRotation]`; texture storage is unchanged. Lifetime rotation uses the shared 64-segment Hermite sampling and is an absolute additive offset, not angular velocity. Positive angles rotate counterclockwise after accounting for downward canvas Y. Pixi rotates the aspect-correct quad around its center before applying the object transform, leaving simulation velocity unchanged. Initial degree updates affect future births, curve edits require recreation. `orientation` defaults to `"default"`; `"initial-direction"` aligns local up to the shape's spawn direction, then adds initial rotation and lifetime rotation. Alignment is captured at birth even at zero speed and remains fixed when gravity changes velocity. Box points up, circle points radially outward (including zero diameter), and Cone2D points away from its tip with an up fallback at zero length. Reparticle's extra point shape uses its sampled direction/spread. Orientation edits require recreation. The stored `initialRotation` includes this alignment. `"movement-direction"` captures the incoming velocity heading before modifiers on each simulation step, including the birth velocity after emitter transformation and inheritance. Pixi combines that captured heading with initial rotation and the lifetime offset. A force-induced turn changes the visual heading on the following step, matching Defold. As in Defold, squared speed must exceed `0.0001`; otherwise only the rotation offsets apply, with no retained heading. Directions nearly opposite local up use Defold's half-turn fallback (`abs(upDot + 1) <= 0.0001`). The previously reserved geometry channel stores `movementRotation` in degrees; no texture band, simulation pass or CPU readback is added. Paused rendering retains this angle; local hierarchy transforms still apply at draw time. Angular velocity, rotation spread and emitter transforms were added in subsequent steps below.

Storage terminology: `motion` is `[x, y, velocityX, velocityY]`, `properties` is `[age, lifetime, initialSize, initialRotation]`, and `color` is `[initialRed, initialGreen, initialBlue, initialAlpha]`. Initial values belong to each particle and are captured at spawn; later emitter parameter changes do not replace them. These are internal Reparticle names aligned with our JSON and Defold's editor terminology, not Defold's exact internal field names.

Initial speed/lifetime spread uses `initial.speedSpread` and `initial.lifetimeSpread`, both nonnegative absolute half-ranges defaulting to zero. Each property samples a separate signed random offset at spawn: `base + random(-1, 1) * spread`, matching Defold's per-property spread semantics. Sampled negative speed reverses motion; sampled nonpositive lifetime still survives the birth frame, then expires on the next positive-time update. Initial-direction alignment still uses the shape direction, while movement-direction alignment follows the resulting signed velocity. Runtime edits affect future births only. Prewarm uses `lifetime + lifetimeSpread` as its maximum lifetime. The deterministic property streams use float32-safe integer arithmetic (not Defold's exact random sequence); the debug overlay mirrors sampled lifetimes without GPU readback. Existing `initial.spread` remains the point shape's full angular spread in radians.

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

`initial.lifetime` accepts a constant or an emitter-time Hermite curve in seconds. Each newborn captures the evaluated value plus its independent lifetime spread; existing particles keep their stored expiry time and use that lifetime to normalize all particle-time curves. Nonpositive sampled lifetimes survive their birth frame and expire on the next positive-time update. Prewarm caps its replay using the maximum of the cached lifetime samples plus spread, including Hermite overshoot between authored points. Debug counting evaluates the same lifetime curve on the same emitter clock and retains each birth's sampled lifetime. Numeric lifetime patches replace the curve for future births; unrelated updates preserve it. Demo controls provide constant, ramp-up, fade-out and authored JSON choices.

Emitter `durationSpread` and `startDelaySpread` default to zero and are nonnegative seconds. Following [Defold's emitter initialization and reset behavior](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp), each is an independent signed variation sampled once at creation: `duration = max(0, duration + random * durationSpread)` and `startDelay = startDelay + random * startDelaySpread`. Negative sampled delay advances the initial emitter clock; it is not clamped. Looping and reset retain both samples, and delay applies only before the first loop. Emitter-time curves use the sampled duration. Reparticle uses its own deterministic seed streams (9 for duration, 10 for delay), not Defold's exact random sequence. These settings require emitter recreation; the demo exposes both spreads and mirrors the sampled timing in its debug count and prewarm.

`emission.rateSpread` is a nonnegative particles-per-second amount, defaulting to zero. As in [Defold](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp), one signed offset is sampled at emitter creation and applied after evaluating the emitter-time spawn-rate curve: `max(0, curve(age) + offset)`. The offset persists across loops, resets, and numeric rate updates. Changing spread requires recreation. Reparticle uses deterministic seed stream 11; its random sequence is not Defold's. The demo exposes emission spread and includes it in prewarm and live-count tracking.

Emitter shape dimensions accept either a number or an emitter-time Hermite curve: circle `diameter`, box/cone2d `width` and `height`. Each dimension has its own nonnegative spread (`diameterSpread`, `widthSpread`, `heightSpread`, default zero). Following Defold, curves are sampled at the current emitter age and independent signed spread is added per particle at birth, before shape position and direction are calculated. Signed dimensions are preserved, including negative curve samples and spread results. Point emitters have no size properties. Existing particles are unaffected. Numeric dimensions and spreads can change at runtime; replacing a curve requires recreation. GPU seed streams 12 and 13 provide independent X/Y variation without additional particle storage or readback. The demo provides separate dimension curves and spread controls.

`inheritVelocity` defaults to zero and is a finite scalar that can be changed at runtime. Following [Defold](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp), emitter velocity is estimated as position delta divided by frame time, then multiplied by the inheritance factor and added to each newborn particle's configured velocity. The first position sample contributes zero velocity; reset clears motion history. Zero-time updates record position without recomputing velocity. Prewarm starts with zero inherited motion. Existing particles retain their velocity. Initial-direction orientation remains based on shape direction, while movement-direction orientation uses the resulting particle velocity. Motion is measured from the transformed emitter origin; ParticleView now includes its current Pixi parent hierarchy automatically. Inheritance applies only in world emission space; local space ignores the factor.

`space` selects `world` (default) or `local` and requires recreation to change. World particles capture the emitter position at birth and remain behind when `emitter.x/y` moves. Local particles simulate around the origin; the Pixi adapter adds the current emitter position at draw time, so existing particles follow even without another simulation step. Inheritance is ignored in local space, as in Defold. Emitter translation, rotation and uniform scale are supported. The ParticleView/parent Pixi transform now drives the shared simulation transform, so world particles stay behind and local particles follow. Gravity and particle orientation operate in the selected simulation space. No extra per-particle data or GPU readback is required. The demo exposes both modes and restarts when switching.

Top-level `rotation` sets emitter rotation in degrees, positive counterclockwise like Defold. It defaults to zero and supports numeric runtime updates or `emitter.rotation = degrees`. World-space births rotate shape offsets and configured velocities about the emitter before adding inherited world velocity. Default and initial-direction particle orientation include the emitter rotation at birth; movement-direction orientation uses the resulting velocity without adding the emitter angle twice. Existing world particles retain their state. Local-space particles keep local coordinates and the Pixi renderer rotates their positions and artwork using the current emitter rotation, including when simulation is paused. Particle `initial.rotation` and its curves remain independent. Gravity stays in the selected simulation coordinate system. The demo exposes an emitter rotation slider.

Top-level `scale` is a finite uniform factor, defaults to 1, and supports runtime updates or `emitter.scale = factor`. Following Defold, world-space births scale shape offsets, initial speed (including spread), and initial particle size (including spread) before storing them. Inherited world velocity is added afterward, without scaling. Existing world particles retain birth size and velocity; the acceleration magnitude uses the current world scale, so changing scale can change their subsequent acceleration. Local simulation remains unscaled; rendering scales existing particle positions and artwork around the emitter before rotation and translation, including while paused. Zero collapses the effect and signed scales are retained. Particle size curves remain independent. The demo slider updates scale live without restarting.

`{ type: "drag", ... }` in `modifiers` supports `magnitude` (number or emitter-time curve, default 0), `spread` (nonnegative, default 0), `useDirection` (default false), and `rotation` (degrees, default 0). Defold's drag formula subtracts the selected velocity component multiplied by `min((magnitude + spread * particleFactor) * dt, 1)`. Negative sampled drag accelerates; positive drag cannot reverse velocity. Directional drag projects onto the modifier's rotated X axis, including emitter rotation in world space. Drag does not scale with emitter scale. Drag acts on the velocity produced by earlier entries. Replacing the modifier list updates living particles, including curve changes.

The fourth RGBA row band, `dynamics`, stores `[active, spreadFactor, initialAngularVelocity, accumulatedRotation]`. Stream 14 samples a signed factor once per birth; it persists until that slot is reused and replays after reset. At the drag implementation stage, storage became 64 bytes per slot per texture (up from 48), with the same GPU pass and no readback. All modifiers reuse this factor. Drag applies to newborn velocity as well. Living particles now use Defold’s semi-implicit position integration after the ordered modifier pass. Newborn positions advance by the same full simulation step.

`{ type: "acceleration", ... }` in `modifiers` replaces the old `modifiers.gravity` field. It supports `magnitude` (number or emitter-time curve, default 0), `spread` (nonnegative, default 0), and `rotation` (degrees, default 0). Like Defold, it accelerates along rotated local +Y (up on canvas), with `velocity += direction * (magnitude + spread * particleFactor) * dt`. Rotation is counterclockwise; 180° gives downward gravity. World space combines emitter and modifier rotation and multiplies magnitude/spread by emitter scale; local space uses modifier rotation only, with the emitter transform applied during rendering. Acceleration applies to newborn and living velocities at its authored list position, sharing the stored birth spread factor without another texture band. List replacements affect living particles. Position uses the final modified velocity; this also applies on the birth frame. Both example JSON files and the demo now use downward acceleration instead of gravity; no legacy gravity field is accepted.

`{ type: "radial", ... }` in `modifiers` supports `magnitude` (number or emitter-time curve, default 0), `spread` (nonnegative, default 0), center `x`/`y` (emitter-relative logical units, default 0), and `maxDistance` (nonnegative logical units, default 100). Positive magnitude repels and negative magnitude attracts. Following Defold, strength has no distance falloff; the cutoff includes its boundary, and zero distance affects only particles exactly at the center. At the center, the particle's current orientation supplies the direction, including lifetime rotation and movement orientation. The existing shared spread factor stays fixed for each birth. World-space center offsets rotate and scale with the emitter, while magnitude/spread and cutoff use its scale; local simulation leaves those values untransformed. Replacing the modifier list affects living particles, including magnitude curves. Defold samples maximum distance only at its first curve point, so this API represents it as a constant number.

Radial applies at its authored list position. All modifiers contribute to velocity before the single position step. No additional particle texture band or CPU readback is introduced. Orientation is evaluated only when a radial modifier is active. The demo exposes magnitude/curve, spread, center, and cutoff; radial defaults to disabled in both example JSON files.

`{ type: "vortex", ... }` in `modifiers` adds the 2D form of Defold's Z-axis vortex. It supports `magnitude` (number or emitter-time curve, default 0), `spread` (nonnegative, default 0), emitter-relative center `x`/`y` (default 0), `maxDistance` (nonnegative, default 100), and `rotation` (degrees, default 0). Positive magnitude accelerates counterclockwise in canvas coordinates; negative reverses it. Tangential acceleration has constant strength inside the inclusive cutoff. At the exact center, Defold's rotated negative-X direction supplies the fallback, independent of particle orientation; in 2D, modifier rotation only changes this fallback. World-space offsets rotate/scale with the emitter; magnitude, spread, and cutoff scale with it. Local simulation leaves the emitter transform to rendering. Maximum distance is constant, matching Defold's first-sample-only evaluation.

Vortex shares the existing per-birth spread factor and applies at its authored list position. List replacement changes living-particle forces. No new particle storage or CPU readback is needed. The demo includes magnitude/curve, spread, center, distance, and center-fallback rotation controls.

`orientation: "angular-velocity"` follows Defold's dedicated spin mode. `initial.angularVelocity` is a number or emitter-time curve in degrees/second (default 0); `initial.angularVelocitySpread` is a nonnegative signed ± range (default 0), sampled once per birth with stream 15. `overLifetime.angularVelocity` is a dimensionless multiplier curve (default 1), despite the editor's angular-velocity naming. Each step accumulates `birthAngularVelocity × lifetimeMultiplier × seconds`. Positive spins counterclockwise, negative clockwise. Initial rotation and world-space emitter rotation establish the starting angle. This mode ignores `overLifetime.rotation` and does not align to movement or spawn direction; the other orientation modes ignore angular velocity. These rules follow Defold's `EvaluateParticleProperties` angular-velocity branch.

The fourth texture band now uses two previously reserved channels for captured angular velocity and accumulated rotation; this step did not increase the then-current 64 bytes per slot per texture. Pixi reads the accumulated angle only in spin mode, and radial's center fallback uses that same updated angle. No CPU readback or additional simulation pass is added. Numeric birth-speed/spread updates affect future births; curves and orientation require recreation. Spin advances on the birth frame using the multiplier at the advanced normalized age and the sampled particle lifetime. Subsequent steps sample the multiplier at the updated normalized age. Reset and slot reuse clear accumulated spin. Constant spin is frame-rate independent; nonconstant curves use Defold-style per-step numerical integration, so timestep changes can slightly alter the result. Prewarm uses the existing fixed 1/60-second step.

In the demo, choose **Orientation → Angular velocity** to expose initial spin, emitter-time curve/spread, and particle-lifetime multiplier presets. The ordinary lifetime rotation control is hidden in this mode. JSON examples retain zero initial spin for backward-compatible visuals.

`initial.stretchX` and `initial.stretchY` accept numbers or emitter-time curves, defaulting to 0. Their nonnegative `stretchXSpread`/`stretchYSpread` ranges default to 0 and use independent birth streams 16/17. Captured values persist until a slot is reused; numeric edits affect future births. `overLifetime.stretchX` and `overLifetime.stretchY` are additive particle-lifetime curves, also defaulting to 0. Defold's formula for each axis is `initialSize × lifetimeScale × (1 + initialStretch + lifetimeStretch)`, with texture aspect ratio and emitter scale applied as usual. These are dimensionless factors: 0 is unchanged, 1 doubles, −1 collapses, and values below −1 flip that axis. No clamping, timestep accumulation, or velocity dependency is applied. Stretch operates before particle orientation/rotation. Curve edits require recreation.

The fifth RGBA row band, `geometry`, stores `[initialStretchX, initialStretchY, initialHandedness, movementRotation]`, increasing allocation from 64 to 80 bytes per slot per texture (25%, before row padding). Simulation still uses one GPU pass and rendering reads the texture directly. Pixi packs scale, rotation, stretch X, and stretch Y samples into one 65-entry vec4 array; together with packed color curves this fits WebGL2's minimum vertex uniform budget. The demo's Stretch panel exposes each axis's initial curve, value, spread, and lifetime curve. Both example JSON files use zero stretch. Velocity-dependent stretch is described below.

Top-level `stretchWithVelocity` defaults to false and accepts live boolean updates through `setParameters`. When enabled, Defold's formula changes only the Y factor to `1 + (initialStretchY + lifetimeStretchY) × length(currentVelocity) / 120`. X retains ordinary stretch. The fixed `1/120` factor corresponds to Defold's 60 FPS, 180-degree shutter convention, not the current timestep or display refresh rate. Velocity is read after simulation modifiers: stationary particles have no added Y stretch, and speed 120 produces the ordinary Y stretch amount. Signed stretch still supports collapse and flips. This does not select movement orientation automatically; choose `movement-direction` to align the stretched local Y axis to motion.

World-space speed includes the birth emitter scale and inherited velocity; local simulation speed remains unscaled, with the emitter transform applied during drawing. Pixi applies the factor directly from the existing motion texel, with no extra storage, readback, or simulation pass. The Stretch panel toggle updates existing particles immediately, including while paused, without resetting the effect. Both JSON examples default it to false.

### Blend modes

Each emitter has `blendMode`: `normal` (default), `add`, `multiply`, or `screen`.
The Pixi renderer uses Pixi's default premultiplied-alpha blend factors for textured and
procedural particles alike. With premultiplied source color S, source alpha A,
and destination color D, RGB output is:

- Normal: S + D × (1 − A).
- Add: S + D.
- Multiply: S × D + D × (1 − A).
- Screen: S + D × (1 − S).

Normal, multiply, and screen use source-over alpha accumulation; add sums alpha.
Texture alpha, particle alpha, and view opacity are already incorporated into the
premultiplied source color. The previous `alpha` blend-mode name is no longer
accepted; existing effect JSON must use `normal`. Opacity properties remain `alpha`.
`emitter.setParameters({ blendMode: 'add' })` affects the next render, including
existing particles while paused. It does not restart simulation or add particle
state. The demo exposes this under Appearance. Procedural particles now default
to Normal too; choose Add explicitly for their previous additive appearance.

### Pixi atlas frames

Texture configuration belongs to `@reparticle/pixi`, separate from the core effect
JSON. Load a Pixi spritesheet in the host, then select a named frame:

```ts
const atlas = await Assets.load<Spritesheet>('textures/particles.json');
const view = new ParticleView(effectConfig, { atlas, frame: 'star' });
view.setTexture({ atlas, frame: 'leaf' });
```

A standalone texture uses `{ texture }`; `{ texture: null }` selects procedural
particles. The existing `view.texture` property also accepts resolved Pixi textures.
`ParticleTexture` is the exported union for these options. Atlas objects expose a
`textures` map, so Pixi `Spritesheet` instances work directly. Missing frame names
throw before replacing the current texture or allocating a new view's GPU resources.
The caller owns all textures and atlas resources; destroying the view does not destroy them.

Frames respect Pixi UV rotation and trim offsets, retaining the original untrimmed
image's proportions and center. Initial size still controls the longest original
dimension; automatic sizing is described below. Flipbook playback is described below. Switching
frames affects all existing particles immediately without restarting simulation,
including while paused. No simulation state, CPU particle readback, or extra draw
pass is added. The demo's three artwork choices now share `textures/particles.json`.

### Pixi flipbook animation

Animation is also a Pixi texture option, never part of the core effect config:

```ts
const view = new ParticleView(effectConfig, {
  atlas,
  animation: 'flames', // name in atlas.animations
  playback: 'loop-forward',
  fps: 30,
});
view.setTexture({ atlas, animation: 'smoke', playback: 'once-forward' });
```

Playback supports `none`, `once-forward`, `once-backward`, `once-pingpong`,
`loop-forward`, `loop-backward`, and `loop-pingpong`. Default playback is
`loop-forward`, with 30 FPS. Following
[Defold's particle animation timing](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp),
once modes fit the sequence into each particle's lifetime and ignore FPS; loop
modes use FPS. Ping-pong has `2 × frameCount − 2` steps, without duplicated
endpoints. None selects the first frame; a one-frame sequence stays static.
FPS must be finite and nonnegative; zero freezes loops at their starting frame.
The renderer uses particle age minus half the most recent positive simulation
step, clamped to zero. Paused rendering
retains that offset. Reset restarts particle ages. Prewarming naturally advances
animation through the existing particle ages. Live animation changes use current
ages, without restarting the emitter or maintaining a separate animation clock.

A Pixi `BufferImageSource` in `rgba32float` format stores four texels per animation
frame (64 bytes: UV corners, trim rectangle, original dimensions, two reserved
components). Frame selection builds the table; Pixi uploads it on first binding
and retains it for subsequent draws. Nearest sampling, clamp-to-edge, disabled
mipmaps, and no alpha premultiplication preserve the numeric metadata. Replacing
an animation destroys the old source without destroying caller-owned artwork. The vertex shader chooses each particle's frame independently;
there is no particle readback, CPU animation loop, extra simulation storage, or
extra draw pass. Rotation and trim work per frame. The existing manual sizing
uses each frame's original proportions; this is a confirmed Defold compatibility
gap (see the 2D audit). Automatic sizing is described below.
All frames must share one Pixi texture source; multi-page animations are explicitly
rejected. Empty or unknown animations and invalid settings leave the old selection
intact. Frame metadata is snapshotted: call `setTexture` again after editing it.
The view owns the metadata table only; the host retains ownership of atlas images.
The demo offers loop, lifetime-once, and ping-pong atlas examples in Particle texture.

### Multiple emitters per effect

`EffectConfig.emitters` accepts a nonempty list with unique IDs. Following Defold's
composition model, every emitter owns its capacity, seed, duration/play mode,
start delay, prewarm, birth properties, curves, modifiers, and blend mode. All
start from the effect's initial time; delayed emitters wait independently, and a
finished once emitter does not stop looping siblings or remove its living particles.
Core validates the whole effect before any GPU allocation. Texture data stays in Pixi:

```ts
const view = new ParticleView(effectConfig, {
  emitters: {
    smoke: { texture: smokeTexture },
    fire: { atlas, animation: 'flames', playback: 'loop-forward', fps: 30 },
    sparks: { atlas, frame: 'spark' },
  },
});
view.update(seconds); // advance every emitter, including independent prewarm/delay
view.getEmitter('fire').setParameters({ emission: { rate: 200 } });
view.setEmitterTexture('sparks', { atlas, frame: 'star' });
view.reset(); // reset every simulation and repeat its authored start behavior
```

Omitted texture selections use procedural particles; unknown emitter IDs fail.
`view.emitters` is a read-only map for iterating the simulations. Each emitter's
`x`/`y` controls its emission origin. The effect display object's transform and
opacity apply to every emitter draw, with bounds and hit areas still opt-in.
`getEmitterTexture(id)` returns the selected texture (the first frame for animation).
Single-emitter construction and `emitter`, `texture`, `setTexture` conveniences
remain available; those conveniences reject multi-emitter effects rather than
silently choosing the first emitter.

The renderer draws in definition order with one simulation and draw per emitter.
Each emitter retains its own texture allocation; total memory and slot work scale
with the sum of capacities, including per-emitter row padding. There is no merging
of capacities, readback, or per-particle CPU loop. GPU resources are cleaned up on
partial construction failure and destruction; caller-owned artwork survives.
Shared effect-root modifiers are described below. Effect-wide resource budgets are a host-level concern outside the current contract.
This adds independent composition, not changes to the documented simulation integrator.

The demo's **Multiple emitters example** link (`?multiple`) loads
`public/multiple-emitters.json`: looping fire, delayed smoke, and a once-only spark
burst. Pause and restart operate on the whole effect. Texture selection is in the
Pixi host example, not that JSON.

### Shared effect modifiers

The root `modifiers` array accepts the same typed entries as an emitter’s `modifiers`.
Both default to an empty list. Multiple entries of any type are supported:

```json
{
  "version": 1,
  "modifiers": [
    { "type": "acceleration", "magnitude": 45, "rotation": 90 },
    { "type": "drag", "magnitude": 0.2 },
    { "type": "acceleration", "magnitude": 10, "rotation": 0 }
  ],
  "emitters": ["... emitter definitions ..."]
}
```

Each emitter receives both scopes. As in
[Defold's effect compiler](https://github.com/defold/defold/blob/dev/editor/src/clj/editor/particlefx.clj),
shared modifiers apply after the emitter's own modifiers; they never replace a
same-kind local modifier. Within each scope, array order is preserved exactly, as in
[Defold’s particle update](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp).
For example, acceleration then drag damps the added velocity; drag then acceleration does not. Shared curves sample the receiving emitter's normalized
timeline, including its duration, start delay, loops, and prewarm. Spreads reuse
that particle's captured modifier variation, just like local modifiers. Modifier time
is the emitter timer divided by authored duration, while emission and initial properties
use sampled duration. Zero authored duration samples zero. Beyond time one, modifier
magnitudes continue the final sampled line rather than clamping to its endpoint.

Shared centers and directions are expressed in effect simulation coordinates.
World-space emitters apply the effect transform; local-space emitters inverse-transform
them by their origin, rotation, and scale. Moving an emitter does not move a shared
radial/vortex center. Force and distance conversion preserves effect-space strength
under local scale, including negative scale. A collapsed zero-scale local emitter
skips shared forces because its transform has no inverse. ParticleView synchronizes the effect transform from its Pixi hierarchy automatically.

Core's `Emitter` accepts the shared definition as its third argument:
`new Emitter(context, effect.emitters[0], effect.modifiers)`. ParticleView passes it
to every emitter automatically. Shared configuration is validated and sampled at
construction; recreate the effect to change it. Per-emitter `configuration` and
`setParameters` remain local and do not absorb or override the shared definition.
The demo forwards root modifiers during single-emitter recreation too.

All modifiers execute inside the existing GPU integration pass, with one reusable
parameter buffer per emitter. No additional particle storage, readback, simulation
pass, or draw is added. Disabled entries are omitted from the sampled buffer without
reordering active entries. The GPU loop stops at the active count. Limits are 64
entries per scope (128 combined); validation rejects overflow instead of truncating.
This is a Reparticle GPU implementation limit, not a Defold limit.

`setParameters({ modifiers: [...] })` replaces the emitter-local list atomically,
including order, count, values, and curves. `[]` removes all local modifiers. The
root list is immutable for an existing effect. The former named-object format is
no longer accepted; migrate each object member to an array entry with `type`.

The demo edits the first entry of each type and preserves later entries and their
order. Its multi-emitter example uses two independent shared accelerations. Living and newborn
positions advance once using final velocity after every modifier. Newborn age is
the full simulation step, so lifetime curves also advance on that first frame.
This follows [Defold’s update order](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp):
existing particles age and expire strictly after their lifetime before new particles
spawn. The exact lifetime endpoint survives. All newborns survive their birth frame,
even when their sampled lifetime is zero, negative, or shorter than that step.
Zero-time updates do not prune them. Expired slots stop moving and spinning.

The `dynamics` band's first channel stores `active`: initialization
and clear set it to zero, spawning sets it to one, and expiration clears it.
Pixi uses that flag for visibility, independently of lifetime curves and alpha.
Lifecycle batch tracking and the demo live count use the same cutoff and newborn
exception, so `sleeping` is announced when the last active slot is removed. This
adds no texture allocation, GPU pass, or readback. Ages remain float32 accumulated
ages in Reparticle rather than Defold's decremented remaining lifetime.

### Emitter lifecycle and notifications

Core `Emitter` exposes `play()`, `stop({ clear?: boolean })`, `clear()`, `state`,
and `onStateChange(listener)` (returns an unsubscribe function). State changes
follow [Defold's particlefx API](https://defold.com/ref/particlefx-lua/): prespawn
waits for delay, spawning includes zero-rate/gated emission, postspawn stops births
while particles drain, and sleeping means no particles remain and no future births
are scheduled. A once emitter reports spawning and postspawn even when its duration
fits in one frame; loops do not report a new transition every cycle. Stop during
delay cancels pending prewarm. Clear removes particles immediately; sleeping is
resolved on the next positive update, as in Defold's update-driven state machine.
Zero-time updates never consume lifecycle transitions. Emitter-time modifier curves
continue advancing while draining: the timer caps at sampled duration, then is divided
by authored duration.

Existing construction remains auto-started. `play()` restarts the existing
simulation from its initial seed, clearing old particles and reapplying delay and
prewarm. It enables the manual emission gate. Existing `reset()` keeps its restart
semantics but preserves that gate. Reparticle does not create overlapping playback
instances on repeated play calls. Notifications are synchronous after the GPU
operation completes; prewarm may produce multiple ordered transitions in one call.
The event describes each transition; reading `state` returns the current state,
which may already be later in that sequence. Subscribers do not receive an initial
snapshot. Listeners may unsubscribe or restart/destroy an emitter; destruction
removes subscriptions without synthesizing a completion event.

Pixi `ParticleView` emits `statechange` through its inherited event emitter. Use
`on`, `once`, and `off` to manage subscriptions. Events include `emitterId`, `state`, and
`awakeEmitters`. Pixi removes the listeners when the view is destroyed. Subscriptions
follow Pixi's event semantics, including repeated registration of the same listener.

Sleeping is determined without GPU readback or per-particle CPU motion simulation.
`ParticleSlots` owns a free-slot stack, captured float32 lifetimes, and birth batches
with a shared float32 age. Existing slots expire strictly after lifetime before
new requests are admitted; all admitted newborns survive their birth frame. Only
free slots are reused. Excess requested births are dropped, and only fractional
emission carry survives to the next frame. The emission seed advances only when
at least one birth is admitted. Numeric lifetime changes affect future births only.

Each batch's slot IDs are sorted by sampled lifetime when spread is used. Expiry
visits each live batch and frees its expired prefix; it does not scan every live
particle. Long-lived batch tails compact their expired prefixes to bound storage.
Births and deaths require per-slot CPU bookkeeping, but motion, modifiers, curves,
and rendering remain GPU work. This replaces the old ring overwrite policy and
range-maximum lifecycle index. Reset/clear discard allocation state; prewarm uses
the same admission rules. Sleeping emitters skip simulation and rendering.

A spawn bitmask packs 24 physical slots into each float32 word, keeping every bit
exact. It costs 4 × ceil(capacity / 24) bytes per update input: 16,668 bytes for
100,000 slots. Kernel invocations test their own bit in constant time, so scattered
free slots still spawn in the existing single GPU update pass. This adds CPU-side
allocation memory and an input upload, but no GPU readback, compaction pass, or new
particle-state channel. Slot reuse and random sequences are deterministic within
Reparticle; Defold's compacting storage order and PRNG sequence are not reproduced.

The demo's debug counter replays `ParticleSlots` with its own allocation metadata,
keeping admitted birth counts, seed progression, expiry, and lifecycle completion
consistent without exposing a live-count instrumentation API on `Emitter`.

`ParticleView` forwards controls to every emitter and forwards state events with
`emitterId`, `state`, and the number of awake emitters at that transition.
`awakeEmitters === 0` on a sleeping event signals whole-effect completion.
Renderer state is restored before forwarding callbacks. Texture configuration
remains separate and is unaffected by playback. The `?multiple` demo displays
notifications and provides restart, stop, clear and pause controls.

### Automatic frame sizing (Pixi only)

`ParticleTexture.sizeMode` accepts `manual` (default) or `auto`, with runtime
validation before changing texture resources. Core JSON, GPU state and simulation
are unchanged. The renderer follows [Defold's CreateParticleRenderContext and
UpdateParticleRenderState](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp):
Auto applies only to multi-frame animations whose playback is not `none`.
Single/static frames retain manual size, even when Auto is selected. A multi-frame
animation at zero FPS still qualifies and holds its first frame.

The frame table's fourth texel stores original width/height and two reserved components.
Storage remains four RGBA texels (64 bytes) per frame. The shader chooses original
frame dimensions in Auto mode and animation reference aspect times captured initial size in
Manual mode, then applies lifetime scale, stretch, orientation and display
transforms. Trim offsets remain normalized against the original frame; packed
rotation only changes UVs. Initial size curves/spread do not affect Auto geometry.
Like Defold's Auto branch, world-space size does not include the scale embedded in
captured initial size; local emitter scale and the Pixi display transform still
apply. No per-particle CPU work, GPU readback or additional draw pass is introduced.

Switching texture options updates living particles immediately, including while
paused. Texture dimensions are Pixi logical dimensions (`orig`), so high-resolution
assets and renderer DPR retain their normal logical-unit semantics. The demo has
an explicit automatic-size animation selection beside its manual animations.

### Particle pivot (Pixi only)

`ParticleTexture.pivot` is a finite `{ x, y }` offset, centered at zero by default.
It is copied and validated before resource allocation or texture-selection changes.
Core configuration, particle state and simulation are unchanged. The renderer
follows [Defold's pivot transform composition](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp):
scale the pivot by the animation's base aspect, apply particle scale/stretch,
rotate it with the particle, and translate it with the particle position. Positive
Y is upward, converted to canvas coordinates in the shader. This is a geometry
offset, not Pixi's normalized anchor convention; manual `y: 0.5` puts the bottom
edge at the simulated position. Values outside the image are supported.

Manual pivot offsets include captured initial size. Auto offsets deliberately do
not include initial size or the selected frame's dimensions, matching Defold's
Auto transform branch. The animation's `animationSize` supplies its base aspect, defaulting to the first
authored frame's original dimensions. It remains stable across frames and playback
directions and must contain finite positive width and height. Trim offsets continue to describe
the cropped artwork within the original frame, and packed atlas rotation affects
UVs only. Movement direction, angular rotation, local emitter transforms, and
Pixi display transforms apply to both corners and pivot translation.

The implementation adds one vec2 uniform, no particle storage, readbacks, or
additional draw calls. Each emitter owns its pivot selection; changing one texture
configuration does not alter another emitter. Omitted pivot restores zero on
texture replacement. The demo includes a bottom-pivot leaf selection.

### Retire after the current cycle

`Emitter.retire()` and `ParticleView.retire()` follow [Defold's RetireEmitter and
IsEmitterLooping](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp):
set a retirement flag that disables looping without changing the timer, emission
gate, particles, prewarm, or current state. Each emitter finishes its own sampled
duration. The final frame samples the endpoint of emitter-time curves and still
spawns before entering postspawn; sleeping follows normal lifetime completion.
There is no separate retiring state or notification at the moment of the request.

Retiring during delay retains that delay and completes one cycle. Before pending
prewarm, retirement applies throughout prewarm too. After a loop boundary has
already wrapped, the new cycle is the current one. Zero duration completes on the
next eligible positive update. Once emitters are unchanged; draining/sleeping
emitters are not revived. Repeated retirement is idempotent. Stop clears the flag
and stops immediately; reset/play clear it and restore authored loop behavior.
No GPU changes, extra storage, or per-particle work are required.

### Emitter position in effect JSON

Emitter `position: { x, y }` defaults to zero and is validated as finite numbers.
Like [Defold's emitter transform](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp),
the authored offset locates the emitter relative to the effect, with shape rotation
and scale applied around that origin rather than rotating/scaling the position
itself. Reparticle retains its existing downward-positive simulation Y convention.

Runtime x/y accessors and partial `setParameters({ position })` patches edit the
same position, with configuration snapshots reflecting those edits. Reset/play
preserve current transforms. Constructor initialization occurs before prewarm and
velocity sampling, avoiding a false initial inherited velocity. World births and
local drawing use the existing position paths, including local modifier centers,
shared-modifier inverse transforms, and velocity inheritance. World-space living
particles stay where they were born; local-space particles follow runtime emitter
motion, preserving the existing Reparticle local-space model. No kernel changes or
new per-particle storage are required.

The multi-emitter demo stores separate fire/smoke/spark origins in JSON. Its
placement now uses the Pixi hierarchy, which automatically drives the simulation
transform and velocity inheritance as described below.

### Whole-effect simulation transform

Core `EffectTransform` owns finite runtime x/y, counterclockwise degree rotation,
uniform scale and handedness (`1` or `-1`), with atomic partial `set()` and scalar
accessors. Handedness reflects local X before rotation; identity is zero
translation/rotation, scale one and handedness one. ParticleView shares one private instance with all
its emitters and synchronizes it from the Pixi scene hierarchy. Authored emitter positions remain relative
to that effect. Transform composition scales and rotates the emitter origin before
adding effect translation; world rotation is effect rotation plus handedness times
emitter rotation, and world scale multiplies scales. Reset/play leave transforms untouched.

Following [Defold's instance transform and emission-space handling](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp),
world particles receive the composed transform at birth and are not transformed
again by later simulation-transform edits. Local particles retain their local
simulation coordinates and receive the current composed transform when drawing.
This preserves Reparticle's existing emitter-local storage/model.
World-space emitter-local forces use composed centers, directions and scale.
Shared root modifiers are transformed from effect space into world space; local
shared modifiers keep their existing inverse-emitter mapping.

Velocity inheritance measures each emitter's transformed origin, so translating,
rotating or scaling the effect can impart motion to new world-space particles.
Initialization/reset clear velocity history, and pending prewarm uses the current
transform. Local inheritance stays disabled. Runtime values support zero and
negative scale consistently with existing emitter transforms.

ParticleView now owns the simulation transform privately and synchronizes it from
`getGlobalTransform` before every update and draw. This computes current nested
parent transforms even before Pixi's render traversal. Translation, rotation and
uniform scale are decomposed into the core transform. Drawing uses an identity
outer matrix: world positions already contain the scene transform, while local
particles receive the current composed emitter/effect transform in the shader.
This avoids applying the parent transform twice. Drawing while paused refreshes
local placement without advancing particle ages or inherited-velocity history.

Consumers attach the view to a rocket/container and use ordinary Pixi transforms;
no effectTransform synchronization is exposed. Parent movement should happen
before update. Reset/play retain scene placement and clear velocity history.
All ancestors, including camera-style containers, are part of simulation world
coordinates; old world particles do not follow later changes to those ancestors.
The renderer supports rotation and equal-magnitude signed axis scales, including
one-axis reflection on ParticleView or any ancestor. Non-uniform scale and skew
are rejected before simulation rather than silently approximated. Zero uniform
scale is supported. Core-only callers may still supply their
own shared EffectTransform. The composed demo now uses normal Pixi transforms.

The scene matrix determinant determines handedness. Its first column, corrected
by that sign, determines rotation. World births reflect shape offsets, velocity,
initial orientation and rotation spread. The existing geometry band's third
channel stores `initialHandedness`; its final channel stores `movementRotation`. Texture
geometry (including pivot and atlas trim), lifetime rotation and accumulated spin
use the captured sign, so changing the hierarchy never flips living world
particles. Local births store identity handedness and the shader applies the
current composed transform to position and geometry. Shared and emitter modifiers
reflect centers and directions; vortex strength changes sign to reverse its
circulation. Inherited velocity is already in world coordinates and is added
after transforming the spawn velocity. No GPU readbacks, extra texture bands,
additional passes or per-particle CPU transform work are added.

### Runtime emitter tint (Pixi)

`ParticleRendering` combines the existing texture selection with an optional straight
RGBA `tint` (`red`, `green`, `blue`, `alpha`). It lives in Pixi's constructor options,
never in the core effect JSON. Each omitted tint defaults to white with alpha one.
Use `{ texture: null, tint: ... }` for procedural particles.

As with [Defold's material constant overrides](https://defold.com/ref/particlefx-lua/#particlefx.set_constant),
`setEmitterTint(id, tint)` overrides the authored value until `resetEmitterTint(id)`
restores it. `getEmitterTint(id)` returns an independent snapshot. All four channels
must be finite numbers; signed and above-one values are preserved, not clamped.
Inputs are copied and every emitter's configuration is validated before allocation.
Unknown IDs and invalid updates throw without altering the current tint.

Tint multiplies texture color and the particle's initial/lifetime color in the
fragment shader. Tint alpha multiplies both premultiplied RGB and alpha; Pixi
display-object tint and hierarchy tint/alpha compose with it through Pixi's
premultiplied group colors. Render-group roots use the global color alone to avoid
applying their tint or alpha twice. It affects living and future particles on the
next render, including when simulation is paused. No simulation update, restart,
particle readback, extra texture band, or additional draw is needed. Overrides
survive texture/animation replacement and playback resets. Rendering while paused
remains the host's responsibility; the demo requests a render after a tint edit.

The multiple-emitter demo exposes fire RGBA controls, leaving smoke and sparks
unchanged. This implements the built-in tint constant only, not arbitrary custom
materials or consumer shader functions.

## Particle draw ordering

Pixi uses [Defold’s remaining-lifetime sort key](https://github.com/defold/defold/blob/dev/engine/particle/src/particle.cpp):
`clamp((1 - remainingLifetime / maximumLifetime) * 65535, 0, 65535)`,
truncated to a 16-bit integer. Longer remaining lifetimes draw first. The
normalization maximum comes from the initial lifetime curve, excluding spread.
A nonpositive maximum produces equal keys.

Core maintains a logical array of fixed GPU slot IDs. Each simulation step marks
expired slots, walks the logical array forward and swaps its last entry into each
removed position, rechecking that position. Births append in allocation order.
The lifetime sort key is then paired with the current logical index, matching
Defold’s swap-removal and tie-breaking sequence. GPU simulation slots never move.
Indices remain full-width for Reparticle’s capacities above 65,536; there is no
16-bit index wraparound.

Sorting runs during every simulation step, including all prewarm steps and steps
between renders. Core exposes an order revision and `copyParticleOrder(target)`;
Pixi copies and uploads only the completed order when rendering. Paused renders
reuse the buffer, and reset or clear invalidates it. Initial lifetime edits affect
the normalization on the next simulation step. The optional debug counter keeps
allocation tracking without logical sorting.

Sorting takes O(n log n) CPU work for n living particles per step; rendering uploads
4n bytes once per changed draw. Pixi issues one draw per emitter, using its
single-instance draw path when only one particle is alive. Every
texture lookup still addresses the original simulation slot. No GPU readback,
extra simulation pass, or intermediate prewarm order upload is required. Each
view destroys its order buffer; texture ownership and emitter definition order
are unchanged.

## Pixi rendering integration

Draw-order storage uses a Pixi `Buffer` and `Geometry` with an instanced `uint32`
particle ID attribute. Capacity is reserved once without uploading unused slots;
changed orders mark only the live prefix for upload when geometry is bound.
Pixi manages the VAO, integer attribute setup, buffer uploads, and draw calls.
Each emitter reuses an `encoder.draw()` options object containing its shader,
geometry, and state; only the live instance count changes on each draw.
Destroying the geometry also releases its owned buffer. Simulation slots and
CPU particle ordering are unchanged.

Pixi's `GlProgram`, `Shader`, and `UniformGroup` manage compilation, linking,
binding, and uniform uploads. Emitters share the cached program and own separate
dynamic uniform groups, including reusable vector and curve arrays. Groups sync
on each draw so values from another emitter cannot leak across draws. Destroying
an emitter destroys its shader bindings, leaving the shared program cache to Pixi.
GPU.js particle textures are borrowed through cached Pixi `ExternalSource` wrappers.
Particle state, artwork, and animation-frame sources use `Shader.resources`; Pixi
assigns and binds their sampler units. GPU.js retains ownership of simulation
textures, with no copies or readbacks. Each kernel output is wrapped once on first use.

Particle draw state uses Pixi's reusable `State.for2d()` and state system for
blending, depth, culling, and blend equations. Normal, add, multiply, and screen
use Pixi's corresponding default modes without name mapping. No custom blend
factors are applied. In particular, multiply uses Pixi's normal alpha accumulation
on transparent targets rather than preserving destination alpha.

Particle draws preserve the active framebuffer, viewport, stencil test and color
mask. Their local matrix combines the inverse scene transform and relative render
group transform. Pixi's global shader uniform bind group supplies the world transform
(including filter offsets), target projection and group opacity directly to the shader.
This supports render textures (including resolution and frame offsets), filters,
graphics/sprite masks, nested effects and ordinary sibling layering.

The view captures its scene transform during Pixi’s prerender phase, before Pixi
temporarily detaches the rendered subtree or overrides its root transform. This
keeps world/local simulation coordinates separate from the requested projection.
The prerender listener is removed when the view is destroyed.

Particle draws use Pixi's encoder and retain its geometry, shader, texture and
blend/depth state caches for subsequent draws. After GPU.js simulation,
its scissor test is disabled before the usual renderer state reset. Neither path
reads GPU particle data. Bounds and filter areas remain explicitly caller-owned.
Core configuration, simulation textures and particle slot allocation are unchanged.

Simulation operations must finish before rendering starts. The particle pipe wraps
its renderer's `render()` call with a guard cleared in `finally`, because Pixi does
not emit `postrender` when rendering throws. Its own prerender preparation is the
only initialization window inside that call. Nested calls to the same renderer's
`render()` are rejected before entering Pixi.

During rendering, particle update/play/reset/stop/clear, texture replacement, and
destruction throw before changing resources. The borrowed core `EmitterContext`
also supplies `assertAvailable` and `restoreState` callbacks, protecting direct
`view.emitter` operations without importing Pixi into core. Rejected operations do
not run a reset in a `finally` block. Completed or failed GPU work restores state
before lifecycle notifications; a state listener may then render synchronously.
These callbacks are optional for other core consumers. CPU-only parameter and tint
changes do not run GPU.js. The guard does not repair Pixi's own partially completed
render pass if unrelated rendering code throws.

### Artwork flipping (Pixi only)

`ParticleTexture.flipX` and `flipY` are validated booleans, default false.
A vec2 uniform reflects artwork corners in particle-local axes before pivot
translation and particle rotation. This matches Defold's full-frame UV flipping
and mirrors trimmed artwork within its original extent. Packed atlas rotation,
manual/automatic sizing, and animation playback remain independent. No caller
texture mutation, simulation change, readback, or additional draw pass is needed.
Selection changes apply while paused; omitted flags reset to false.

### Stable integer draw-order sorting

CPU draw ordering uses two stable radix passes over the unchanged 16-bit lifetime
key. Low-byte then high-byte bucket placement preserves the existing logical order
for ties, including Defold-style swap removal and appended births. The old rank
array is replaced by equally sized reusable scratch storage, with 256 additional
Uint32 counters (1 KiB per emitter). Sorting introduces no per-call array allocation.
Simulation slots stay fixed; prewarm sorts every step and uploads only its final
order. No GPU readback or particle simulation change is involved.

### Pixi render pipe and initialization

`ParticleView` is constructed with effect and rendering configuration only. Its CPU emitters are available immediately. `ParticlePipe` is a registered WebGL extension instantiated by Pixi with the renderer. It owns per-view drawing resources and inserts particle draw instructions between Pixi batch boundaries.

The pipe prepares particle views in the rendered subtree during `prerender`, before temporary root transforms, framebuffer binding, filters, or masks. This is necessary because GPU.js kernel compilation changes GL state. The draw instruction only renders existing textures; it never advances simulation.

Before first render, updates validate arguments but leave playback paused, with no queued steps. Playback controls and configuration changes are retained. First initialization warms both GPU paths without resetting those controls. Subsequent updates and prewarm operate normally, even offstage. Views are bound to one renderer, and renderer destruction releases its attached views.
