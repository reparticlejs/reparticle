# Defold 2D particle audit

Reviewed 2026-10-19 against Defold **1.13.2**, the stable version reported by its API reference on the audit date. This is a source and existing-test audit, not a claim of pixel-identical output from two running engines. No runtime behavior was changed during this audit.

## Scope and references

Compare portable 2D simulation and particle rendering behavior. Keep texture configuration in Pixi, simulation in core, consumer-authored GPU code out of the API, and normal playback free of GPU readbacks. Sphere, 3D cone, box depth and 3D orientation remain deferred. Defold materials, resource loading, Lua messaging and project settings are engine integration features, not missing Reparticle simulation modules.

References pinned where possible:

- [Particle FX manual](https://defold.com/manuals/particlefx/) and [stable runtime API](https://defold.com/ref/particlefx/).
- [1.13.2 particle schema](https://github.com/defold/defold/blob/1.13.2/engine/particle/proto/particle/particle_ddf.proto): emitter, particle and modifier property inventory.
- [1.13.2 particle runtime](https://github.com/defold/defold/blob/1.13.2/engine/particle/src/particle.cpp): sampling, spawning, forces, ordering and animation rendering.
- [1.13.2 component adapter](https://github.com/defold/defold/blob/1.13.2/engine/gamesys/src/gamesys/components/comp_particlefx.cpp): playback instances and texture-set metadata.

The [architecture checklist](particle-architecture.md#coverage-inventory) distinguishes implemented capabilities from compatibility corrections. A checked capability does not override the specific differences below.

## Implemented coverage and local evidence

| Area                       | Implemented                                                                                                                        | Main evidence                                                                                                                                                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition                | Named emitters, positions/rotations, local and shared ordered modifiers, repeated modifier types                                   | `core/src/config/schemas/definition/effect.ts`, `core/src/runtime/modifiers/sampler.ts`, `pixi/src/runtime/particle-view.ts`; configuration and modifier tests                                                                                                                   |
| Timing                     | Once/loop, duration and delay spread, start offset/prewarm, retire, drain, clear, restart, four lifecycle states                   | `core/src/runtime/playback/emitter.ts`, `core/src/runtime/playback/prewarm.ts`, `core/src/runtime/emitter.ts`; playback/prewarm tests                                                                                                                                            |
| 2D shapes                  | Circle, rectangle, 2D cone; emitter-time dimensions and spread                                                                     | `core/src/simulation/emission/{circle,box,cone2d}.ts`, `core/src/curves/sampled-shape.ts`; shape and dimension tests                                                                                                                                                             |
| Emitter properties         | Spawn rate, initial lifetime/speed/size/RGBA/rotation/stretch X/Y/angular velocity; curves and spread                              | `core/src/config/schemas/definition/effect.ts`, `core/src/runtime/emitter.ts`, `core/src/simulation/kernels/integrate.ts`; initial-property, spread and GPU-function tests                                                                                                       |
| Particle properties        | Lifetime scale/RGBA/rotation/stretch/angular velocity                                                                              | `core/src/curves`, `core/src/simulation/particles/angular-velocity.ts`, `pixi/src/runtime/emitter-view.ts`; curve, spin and stretch tests                                                                                                                                        |
| Orientation and spaces     | Default, initial direction, movement direction, angular velocity; world/local and inherited velocity                               | Core transform/velocity/kernel code and Pixi shader; orientation, inheritance and reflection tests. Movement timing correction below is implemented                                                                                                                              |
| Forces                     | Acceleration, directional/general drag, radial, 2D vortex; magnitude curves/spread and constant distance cutoff                    | `core/src/runtime/modifiers/sampler.ts`, `core/src/simulation/modifiers`; modifier and GPU-function tests. Authored-duration modifier clock and final-segment extrapolation verified                                                                                             |
| Capacity and order         | Keep living slots, drop excess births, expiry, logical swap-removal and lifetime sort with tie breaking                            | `core/src/runtime/particles/slots.ts`, `core/src/runtime/particles/order.ts`, `core/src/runtime/particles/sort-key.ts`, `pixi/src/rendering/order-buffer.ts`; allocator/order tests                                                                                              |
| Images and animation       | Texture/atlas frames, trim/packed rotation, seven playback modes, runtime texture/animation replacement, manual/auto sizing, pivot | `pixi/src/types/particle-texture.ts`, `pixi/src/textures/resolve-flipbook.ts`, `pixi/src/textures/create-animation-frame-source.ts`, `pixi/src/shaders/flipbook.ts`, `pixi/src/runtime/emitter-view.ts`; reference aspect correction complete; remaining asset gaps listed below |
| Appearance and integration | Normal/add/multiply/screen, runtime tint/reset, ordinary Pixi hierarchy, filters/masks/render targets                              | `pixi/src/rendering/state.ts`, `pixi/src/runtime/particle-view.ts`, `pixi/src/runtime/emitter-view.ts`                                                                                                                                                                           |

Paths beginning `core/` or `pixi/` are relative to `packages/`. The existing automated suite has 312 core tests and 75 demo tests. Pixi integration has been exercised by temporary real-browser GPU checks in previous implementation work; those harnesses are not a committed, repeatable repository test suite. This audit does not count those checks as a fresh Defold comparison.

## Confirmed compatibility corrections

### 1. Movement-direction orientation timing — implemented

Defold's [`Simulate` and `EvaluateParticleProperties`](https://github.com/defold/defold/blob/1.13.2/engine/particle/src/particle.cpp#L1372-L1439) resolve visual heading before applying that step's modifiers. The audit found that Pixi instead used post-modifier velocity.

**Corrected:** `integrate.ts` captures the pre-modifier heading in `geometry.movementRotation`, including transformed/inherited velocity at birth. The renderer consumes that angle rather than recalculating heading from the resulting velocity. A shared `movementRotation()` helper preserves the low-speed and opposite-direction fallbacks for both visual orientation and radial-center force direction. The existing texture's reserved channel is used; there is no new texture, pass or GPU readback.

Verification: committed helper and kernel tests cover turns, stops, reversals, inherited/reflected birth velocity, radial-center consistency, pause, expiration and slot reuse. Temporary browser checks compare asymmetric textured particles with an independent pre-force reference in world/local spaces, with reflections and paused parent changes, through Rolldown and Terser minification. These are not a substitute for the still-planned committed browser harness.

### 2. Modifier curve timing — implemented

Defold [`Simulate`](https://github.com/defold/defold/blob/1.13.2/engine/particle/src/particle.cpp#L1569-L1629) normalizes modifiers with authored duration, while emission properties use sampled duration. `EmitterPlayback.modifierAge` now follows that distinction. Zero authored duration samples time zero. Modifier magnitudes extrapolate the final sampled line beyond one; emission and initial-property curves retain their existing sampling.

Tests cover duration spread, all four modifier types in both scopes, nonlinear final-segment extrapolation, draining after stop, loop wrapping, retirement, reset, delay, zero-time updates, and zero authored duration. The existing CPU emitter clock supplies the samples; no GPU readbacks or additional simulation passes are needed.

### 3. Manual flipbook sizing — implemented

Defold uses animation-level dimensions for manual aspect and pivot; only active multi-frame automatic sizing uses individual frame dimensions. Pixi now follows this distinction. Animation texture options accept `animationSize: { width, height }`, defaulting to the first authored frame's original size regardless of playback direction. Dimensions must be finite and positive. The shader keeps that reference aspect in manual mode and uses per-frame original dimensions in automatic mode. Frame trim and UV rotation remain per-frame; single-frame and `none` playback retain manual sizing. No asset metadata enters core JSON.

Verified against Defold's `CreateParticleRenderContext` and `UpdateParticleRenderState` in the audited source. Browser rendering checks compare mixed-aspect, trimmed frames to Pixi sprites, including backward/disabled playback, explicit/default reference size, pivot, paused replacement, and invalid dimensions.

## Missing 2D asset capabilities

### Artwork horizontal/vertical flips — implemented

Defold's [`WriteVertexData`](https://github.com/defold/defold/blob/1.13.2/engine/particle/src/particle.cpp#L1124-L1252) mirrors artwork using animation flags. Pixi texture options now accept `flipX` and `flipY` (boolean, default false) for static frames and animations. The renderer reflects artwork corners before pivot translation, equivalent to UV corner swaps on a full frame, while also reflecting Pixi trim offsets within the original extent. Particle motion and pivot translation remain unchanged; packed rotation and playback direction are independent. Changes affect living particles while paused. Flags are explicit texture options; atlas-specific metadata import is not implied.

### Animation frames spanning atlas pages

Defold's renderer consumes per-frame page indices. Our `resolveFlipbook()` explicitly rejects frames whose `Texture.source` differs from the first frame; the shader binds one artwork source. Single-page atlas animation is complete at this level, but cross-page animation is not supported.

Supporting this requires a Pixi rendering design (texture arrays or ordering-preserving draws), with cost measured before choosing one. It does not require new simulation behavior or core asset fields.

## Intentional differences and exclusions

| Item                    | Current contract                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repeated play           | Defold's component message handler creates another playback instance; Reparticle `play()` restarts the existing instance and clears its particles. This is already documented. Consumers can create separate views for overlapping effects; changing `play()` is an API decision, not a missing force/shape                                                                                                                                                                          |
| Owner deletion          | Defold can retain a playing effect after its game object is deleted. Reparticle `destroy()` releases its resources; hosts must retain/reparent an effect they want to drain                                                                                                                                                                                                                                                                                                          |
| Space/transforms        | Reparticle stores local particles in emitter-local coordinates and follows the current emitter and Pixi hierarchy. It additionally supports emitter scale and reflected hierarchy transforms. Defold's emitter-space representation is not identical; its `CalculateModifierRotation` also omits instance rotation, whereas our force directions follow the whole-effect transform. Preserve the explicitly chosen transform behavior rather than silently copying this source quirk |
| Randomness and numerics | Reparticle uses its own deterministic seed streams, GPU float math, and CPU lifetime bookkeeping. Matching distributions and lifecycle rules does not promise identical seeded particles or bitwise equality across drivers                                                                                                                                                                                                                                                          |
| Runtime edits           | Numeric patches and modifier replacement are supported; most curve/timing/shape-type edits require recreation. Defold editor live editing is a separate authoring capability, not a requirement that its Lua API expose every field                                                                                                                                                                                                                                                  |
| Asset formats           | Pixi textures and atlas objects replace Defold resource IDs. No `.particlefx` / texture-set importer is promised. Deprecated blend aliases are not additional rendering modes                                                                                                                                                                                                                                                                                                        |
| Materials and constants | Default tint and blend functionality are present. Defold material resources, custom attributes and arbitrary shader constants are engine-specific and outside the agreed consumer JSON contract. Dissolve or other invented built-in materials are not Defold parity tasks                                                                                                                                                                                                           |
| Limits and integration  | Explicit per-emitter capacity, modifier limits, WebGL2 requirement, no automatic bounds/hit areas, no readbacks. Global engine resource budgets, render predicates, Lua/GUI APIs and multi-backend rendering are outside this audit's portable runtime scope                                                                                                                                                                                                                         |
| 3D                      | Sphere, 3D cone, box depth, out-of-plane orientation and vortex axes remain deferred                                                                                                                                                                                                                                                                                                                                                                                                 |
| Editor                  | Hierarchy authoring, curve editing, modifier gizmos and save/load workflow are not implemented as a full editor. The React demo is a preview/control surface                                                                                                                                                                                                                                                                                                                         |

## False gaps ruled out

- Maximum-distance animation/spread: the schema can encode them, but Defold's `ApplyRadial` and `ApplyVortex` read the first sampled distance and do not apply its spread. A constant cutoff represents that runtime behavior.
- Static-frame auto size: Defold enables automatic frame dimensions only for an active multi-frame animation. Our fallback to manual sizing for a static or `none` selection is intentional.
- Burst/sub-emitter/collision modules: not present in the audited particle schema/runtime feature inventory. They must not be proposed as missing Defold particle capabilities.
- Unchecked legacy groups for spaces, inheritance, stretch, curves, blending and lifecycle were stale documentation, not missing implementations.

## Next work

1. Add repeatable browser conformance fixtures for the corrections; choose test infrastructure separately, without adding dependencies as part of this audit.
2. Consider cross-page animation only when their use cases justify the rendering/API work.

No additional portable 2D shape, force type, emitter-property family or particle-property family was found missing in the audited schema. That conclusion is capability coverage, not a claim that every numerical edge case has been compared against a running Defold build.
