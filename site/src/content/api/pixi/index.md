---
title: "@reparticle/pixi"
description: "Source-generated API for @reparticle/pixi in @reparticle/pixi."
package: "pixi"
---

## Classes

| Class | Description |
| ------ | ------ |
| [ParticleEffect](classes/ParticleEffect/) | An effect display object. Bounds and hit areas remain opt-in; textures belong to the caller. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [EffectInput](interfaces/EffectInput/) | Authoring input before defaults and validation. |
| [EmitterParameters](interfaces/EmitterParameters/) | Input patch for changing an existing emitter through setParameters(). Omitted fields retain their current values; a supplied modifier list replaces the whole list. Only fields exposed by the runtime schema can be changed. |
| [ParticleEffectOptions](interfaces/ParticleEffectOptions/) | Pixi artwork bindings and runtime integration, separate from the effect definition. |
| [ParticleStateChange](interfaces/ParticleStateChange/) | - |
| [RenderingConfig](interfaces/RenderingConfig/) | Serializable rendering settings with defaults applied. Shared by every renderer. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AnimationFrames](types/AnimationFrames/) | - |
| [AnimationPlayback](types/AnimationPlayback/) | - |
| [AnimationSize](types/AnimationSize/) | Animation reference dimensions in logical texture units. |
| [ParticleBlendMode](types/ParticleBlendMode/) | - |
| [ParticlePivot](types/ParticlePivot/) | Offset from the centered geometry: positive X right, positive Y up. |
| [ParticleRendering](types/ParticleRendering/) | Resolved Pixi artwork for drawing, never stored in the core effect definition. |
| [ParticleSizeMode](types/ParticleSizeMode/) | - |
| [ParticleStateListener](types/ParticleStateListener/) | - |
| [ParticleTexture](types/ParticleTexture/) | Borrowed artwork. Strings are Pixi cache names loaded before assignment. One frame is static; two or more enable animation settings. |
| [ParticleTint](types/ParticleTint/) | - |

## Functions

| Function | Description |
| ------ | ------ |
| [validateAnimationFrames](functions/validateAnimationFrames/) | Validate loaded arrays and narrow them for animation bindings. Textures stay caller-owned. |
