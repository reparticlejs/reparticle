---
title: "@reparticle/core"
description: "Source-generated API for @reparticle/core in @reparticle/core."
package: "core"
---

## Classes

| Class | Description |
| ------ | ------ |
| [EffectTransform](classes/EffectTransform/) | Shared transform from effect-local coordinates to world coordinates. Reflect local X when handedness is -1, then rotate, scale, and translate. Rotation is in degrees, counterclockwise on a canvas whose Y axis points down. |
| [Emitter](classes/Emitter/) | Coordinate one emitter's playback, CPU slot metadata, and GPU simulation. Particle state stays in GPU textures; CPU metadata controls birth admission and expiration without readbacks. The renderer owns the GL context. |
| [EmitterPlayback](classes/EmitterPlayback/) | Frame-based emission clock, independent of individual particle ages. Lifecycle: prespawn (delay) → spawning → postspawn (draining) → sleeping. Loop boundaries stay in spawning. The caller reports when particles have drained through finish(); this class does not track particle counts. |
| [ParticleSlots](classes/ParticleSlots/) | Allocate fixed GPU slots using CPU lifetime metadata, without texture readbacks. Births from one step share an age and form a batch sorted by lifetime. This lets expiration consume each batch from the front instead of scanning capacity. Living slots are never overwritten; requests beyond available capacity are dropped. |
| [SampledCurve](classes/SampledCurve/) | Samples a constant or authored curve once, then interpolates between cached values during playback. Times are normalized: 0 is the start, 1 is the end. |
| [SpawnRate](classes/SpawnRate/) | Evaluate births per second over emitter lifetime, not individual particle age. A seeded spread offset is sampled once and stays fixed across evaluations. SpawnSchedule converts the resulting rate into a whole-particle request. |
| [SpawnSchedule](classes/SpawnSchedule/) | Convert a particles-per-second rate into whole-particle requests per step. Fractional births carry into later steps; whole births above capacity are dropped. ParticleSlots separately decides how many requests fit in currently free slots. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [Curve](interfaces/Curve/) | Parsed scalar curve with at least one point and strictly increasing times. Point times lie in [0, 1], but points at both endpoints are not required. |
| [CurvePoint](interfaces/CurvePoint/) | Parsed curve point: time is normalized lifetime, value uses the property's units, and tangent is the slope (change in value per unit of normalized time). The same tangent applies on both sides of the point; it defaults to zero when omitted from JSON and is always present after parsing. |
| [EffectConfig](interfaces/EffectConfig/) | Parsed effect definition with schema defaults applied. Contains at least one emitter with a unique ID and an effect-level modifier list. Rendering settings contain shared appearance only; artwork belongs to the renderer. |
| [EffectInput](interfaces/EffectInput/) | Authoring input before defaults and validation. |
| [EmitterConfig](interfaces/EmitterConfig/) | Validated emitter data, including the shared rendering contract. |
| [EmitterContext](interfaces/EmitterContext/) | Renderer-owned resources borrowed by an emitter's GPU simulation. Simulation and rendering share a context so particle textures can be consumed directly on the GPU. Destroying the emitter does not destroy these resources. |
| [EmitterInput](interfaces/EmitterInput/) | Emitter authoring input before defaults and validation. |
| [EmitterParameters](interfaces/EmitterParameters/) | Input patch for changing an existing emitter through setParameters(). Omitted fields retain their current values; a supplied modifier list replaces the whole list. Only fields exposed by the runtime schema can be changed. |
| [EmitterStateChange](interfaces/EmitterStateChange/) | One queued playback transition, identified by the emitter's configured ID. |
| [RenderingConfig](interfaces/RenderingConfig/) | Serializable rendering settings with defaults applied. Shared by every renderer. |
| [RenderingInput](interfaces/RenderingInput/) | Authoring form of the shared rendering settings. |
| [StopOptions](interfaces/StopOptions/) | Options for stopping births immediately, rather than retiring after the current loop. |
| [Transform](interfaces/Transform/) | Transform from effect-local coordinates to world coordinates. Apply local-X reflection, rotation, uniform scale, then translation. Coordinates use canvas orientation: +X points right and +Y points down. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [EmitterState](types/EmitterState/) | Emitter playback phase, independent of its emission gate and particle count. |
| [EmitterStateListener](types/EmitterStateListener/) | Receive transitions in order, without an initial event when subscribing. Updates deliver notifications after simulation work; stop/reset also flush transitions. Changes made inside a listener wait until the current batch ends. A callback may observe a newer emitter.state than event.state when several transitions occurred during one update, including prewarm. |
| [ModifierConfig](types/ModifierConfig/) | Parsed acceleration, drag, radial, or vortex modifier with defaults applied. Narrow by `type` to access fields specific to that modifier. The same definition type is used for emitter-level and effect-level modifier lists. |
| [ParticleBlendMode](types/ParticleBlendMode/) | - |
| [ParticleLifetimeVisitor](types/ParticleLifetimeVisitor/) | Synchronous callback used by ParticleSlots.forEachLifetime() for each live slot. Values come from CPU allocation metadata; visiting does not read GPU textures or allocate a per-particle record. Traversal follows birth batches, not draw order. |
| [ParticleTint](types/ParticleTint/) | - |
| [ScalarProperty](types/ScalarProperty/) | Constant scalar or parsed curve. A number keeps the same value at every time. The owning property determines units, whether time follows the emitter or a particle, and whether the evaluated value is an absolute value or a multiplier. |

## Variables

| Variable | Description |
| ------ | ------ |
| [CURVE\_SEGMENTS](variables/CURVE_SEGMENTS/) | 64 intervals require 65 curve samples, including both endpoints. |
| [effectConfigSchema](variables/effectConfigSchema/) | Zod Mini schema for effect JSON. Use `.parse()` or `.safeParse()` to validate. Only implemented configuration features are accepted. Compose schemas with functions from `zod/mini`; validation errors expose an `issues` array. |
| [emitterConfigSchema](variables/emitterConfigSchema/) | Zod Mini schema for one emitter, including defaults and strict field validation. |
| [renderingSchema](variables/renderingSchema/) | Zod Mini schema for shared appearance settings. Artwork is supplied separately by the renderer. |

## Functions

| Function | Description |
| ------ | ------ |
| [parseEffectConfig](functions/parseEffectConfig/) | Validate parsed JSON before GPU allocation and return independent configuration data. |
| [prewarm](functions/prewarm/) | Simulate an effect's start offset before its first visible frame. The caller supplies the normal simulation step, including delay and playback handling, so prewarming can also complete a once-playing emitter. |
| [propertyVariation](functions/propertyVariation/) | Produce repeatable variation in [-1, 1] for a particle property. |
| [sampleCurve](functions/sampleCurve/) | Bake a constant or validated curve into 65 evenly spaced float32 values. Includes both endpoints: time 0 at index 0 and time 1 at index 64. Playback interpolates between adjacent samples instead of evaluating Hermite curves each frame. Constants produce the same value at every sample. |
