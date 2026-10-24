---
title: "ParticleTexture"
description: "Borrowed artwork. Strings are Pixi cache names loaded before assignment.\nOne frame is static; two or more enable animation settings."
package: "pixi"
---

> **ParticleTexture**\<`T`\> = \{ `flipX?`: `boolean`; `flipY?`: `boolean`; `pivot?`: [`ParticlePivot`](../ParticlePivot/); `sizeMode?`: [`ParticleSizeMode`](../ParticleSizeMode/); \} & (\{ `animationSize?`: `never`; `fps?`: `never`; `playback?`: `never`; `textures?`: readonly \[`T`\]; \} \| \{ `animationSize?`: [`AnimationSize`](../AnimationSize/); `fps?`: `number`; `playback?`: [`AnimationPlayback`](../AnimationPlayback/); `textures`: readonly \[`T`, `T`, `...T[]`\]; \})

Borrowed artwork. Strings are Pixi cache names loaded before assignment.
One frame is static; two or more enable animation settings.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="t"></a> `T` *extends* `Texture` \| `string` | `Texture` \| `string` |

## Type Declaration

### flipX?

> `optional` **flipX?**: `boolean`

### flipY?

> `optional` **flipY?**: `boolean`

### pivot?

> `optional` **pivot?**: [`ParticlePivot`](../ParticlePivot/)

### sizeMode?

> `optional` **sizeMode?**: [`ParticleSizeMode`](../ParticleSizeMode/)
