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

| Area                       | Implemented                                                                                                                        | Main evidence                                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition                | Named emitters, positions/rotations, local and shared ordered modifiers, repeated modifier types                                   | `core/src/config/schema.ts`, `core/src/modifiers.ts`, `pixi/src/index.ts`; configuration and modifier tests                                                                         |
| Timing                     | Once/loop, duration and delay spread, start offset/prewarm, retire, drain, clear, restart, four lifecycle states                   | `core/src/emitter-playback.ts`, `core/src/prewarm.ts`, `core/src/index.ts`; playback/prewarm tests                                                                                  |
| 2D shapes                  | Circle, rectangle, 2D cone; emitter-time dimensions and spread                                                                     | `core/src/gpujs/spawn-{circle,box,cone2d}.ts`, `core/src/curves/sampled-shape.ts`; shape and dimension tests                                                                        |
| Emitter properties         | Spawn rate, initial lifetime/speed/size/RGBA/rotation/stretch X/Y/angular velocity; curves and spread                              | `core/src/config/schema.ts`, `core/src/index.ts`, `core/src/gpujs/integrate.ts`; initial-property, spread and GPU-function tests                                                    |
| Particle properties        | Lifetime scale/RGBA/rotation/stretch/angular velocity                                                                              | `core/src/curves`, `core/src/behaviors/angular-velocity.ts`, `pixi/src/emitter-view.ts`; curve, spin and stretch tests                                                              |
| Orientation and spaces     | Default, initial direction, movement direction, angular velocity; world/local and inherited velocity                               | Core transform/velocity/kernel code and Pixi shader; orientation, inheritance and reflection tests. Movement timing correction below is implemented                                 |
| Forces                     | Acceleration, directional/general drag, radial, 2D vortex; magnitude curves/spread and constant distance cutoff                    | `core/src/modifiers.ts`, `core/src/behaviors`; modifier and GPU-function tests. Modifier clock correction below remains open                                                        |
| Capacity and order         | Keep living slots, drop excess births, expiry, logical swap-removal and lifetime sort with tie breaking                            | `core/src/particle-slots.ts`, `core/src/particle-order.ts`, `core/src/particle-sort-key.ts`, `pixi/src/particle-order-buffer.ts`; allocator/order tests                             |
| Images and animation       | Texture/atlas frames, trim/packed rotation, seven playback modes, runtime texture/animation replacement, manual/auto sizing, pivot | `pixi/src/types/particle-texture.ts`, `resolve-flipbook.ts`, `create-frame-texture.ts`, `flipbook-shader.ts`, `emitter-view.ts`; asset gaps and aspect correction below remain open |
| Appearance and integration | Alpha/add/multiply/screen, runtime tint/reset, ordinary Pixi hierarchy, filters/masks/render targets                               | `pixi/src/set-blend-mode.ts`, `pixi/src/index.ts`, `pixi/src/emitter-view.ts`                                                                                                       |

Paths beginning `core/` or `pixi/` are relative to `packages/`. The existing automated suite has 312 core tests and 75 demo tests. Pixi integration has been exercised by temporary real-browser GPU checks in previous implementation work; those harnesses are not a committed, repeatable repository test suite. This audit does not count those checks as a fresh Defold comparison.

## Confirmed compatibility corrections

### 1. Movement-direction orientation timing — implemented

Defold's [`Simulate` and `EvaluateParticleProperties`](https://github.com/defold/defold/blob/1.13.2/engine/particle/src/particle.cpp#L1372-L1439) resolve visual heading before applying that step's modifiers. The audit found that Pixi instead used post-modifier velocity.

**Corrected:** `integrate.ts` captures the pre-modifier heading in `geometry.movementRotation`, including transformed/inherited velocity at birth. The renderer consumes that angle rather than recalculating heading from the resulting velocity. A shared `movementRotation()` helper preserves the low-speed and opposite-direction fallbacks for both visual orientation and radial-center force direction. The existing texture's reserved channel is used; there is no new texture, pass or GPU readback.

Verification: committed helper and kernel tests cover turns, stops, reversals, inherited/reflected birth velocity, radial-center consistency, pause, expiration and slot reuse. Temporary browser checks compare asymmetric textured particles with an independent pre-force reference in world/local spaces, with reflections and paused parent changes, through Rolldown and Terser minification. These are not a substitute for the still-planned committed browser harness.

### 2. Modifier curves use sampled duration instead of authored duration

Defold [`Simulate`](https://github.com/defold/defold/blob/1.13.2/engine/particle/src/particle.cpp#L1569-L1629) normalizes the modifier clock with the authored `ddf->m_Duration`. Its emission-property clock uses the sampled duration instead. Our `Emitter.step()` passes `playback.normalizedAge` to both, which uses the sampled duration. The results differ when duration spread changes the duration and modifier magnitude varies over time. Defold can also evaluate beyond normalized time one using its final linear segment; `SampledCurve.at()` clamps to one.

**Correction:** distinguish the modifier clock from the emission-property clock, including the authored-zero-duration case and final-segment extrapolation. Keep initial-property/emission timing unchanged. Verify nonzero duration spread and postspawn draining with explicit reference cases.

### 3. Manual animation sizing changes aspect ratio per frame

Defold [`CreateParticleRenderContext` / `UpdateParticleRenderState`](https://github.com/defold/defold/blob/1.13.2/engine/particle/src/particle.cpp#L1922-L2025) use animation-level width/height for manual sizing; per-frame dimensions select automatic size. The component adapter supplies those animation-level dimensions. Our frame table stores each frame's aspect, and the shader uses that aspect even in manual mode. An animation alternating wide and tall original frames therefore changes particle geometry in Reparticle.

**Correction:** define animation-level reference dimensions in Pixi rendering configuration and use them consistently for manual size and pivot. Preserve per-frame automatic sizing and atlas trim. Equal-aspect animations are unaffected. Do not put asset dimensions in core JSON.

## Missing 2D asset capabilities

### Animation-only horizontal/vertical flips

Defold's [component adapter](https://github.com/defold/defold/blob/1.13.2/engine/gamesys/src/gamesys/components/comp_particlefx.cpp#L1158-L1171) supplies horizontal/vertical animation flags; [`WriteVertexData`](https://github.com/defold/defold/blob/1.13.2/engine/particle/src/particle.cpp#L1124-L1252) applies them to texture coordinates. Our texture configuration has no equivalent flag or metadata ingestion. Supplying a texture with already mirrored UVs may represent the result, but is not a supported animation-flip setting.

Negative display scale is implemented and remains useful: it mirrors geometry and motion together. This asset setting mirrors artwork while retaining motion. Record it as a Pixi configuration gap, not an unimplemented transform feature or mandatory next task.

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

1. Correct modifier-curve timing under duration spread.
2. Resolve manual animation aspect semantics in Pixi.
3. Add repeatable browser conformance fixtures for the corrections; choose test infrastructure separately, without adding dependencies as part of this audit.
4. Consider animation flip metadata and cross-page animation only when their use cases justify the rendering/API work.

No additional portable 2D shape, force type, emitter-property family or particle-property family was found missing in the audited schema. That conclusion is capability coverage, not a claim that every numerical edge case has been compared against a running Defold build.
