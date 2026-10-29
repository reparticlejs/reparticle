---
title: "EmitterController"
description: "Coordinate one emitter's playback, CPU slot metadata, and GPU simulation.\nParticle state stays in GPU textures; CPU metadata controls birth admission\nand expiration without readbacks. The renderer owns the GPU context."
package: "core"
---

Coordinate one emitter's playback, CPU slot metadata, and GPU simulation.
Particle state stays in GPU textures; CPU metadata controls birth admission
and expiration without readbacks. The renderer owns the GPU context.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="t"></a> `T` *extends* `WebGLTexture` \| `GPUTexture` | `WebGLTexture` \| `GPUTexture` |

## Constructors

### Constructor

> **new EmitterController**\<`T`\>(`context`, `definition`, `sharedModifiers?`, `effectTransform?`): `EmitterController`\<`T`\>

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `context` | [`SimulationContext`](../../interfaces/SimulationContext/)\<`T`\> \| `null` | `undefined` |
| `definition` | \{ `capacity`: `number`; `duration`: `number`; `durationSpread`: `number`; `emission`: \{ `rate`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \}; \}; `id`: `string`; `inheritVelocity`: `number`; `initial`: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread`: `number`; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread`: `number`; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread`: `number`; `direction`: `number`; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread`: `number`; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread`: `number`; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread`: `number`; `size`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread`: `number`; `spread`: `number`; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread`: `number`; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread`: `number`; \}; `modifiers`: (\{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"drag"`; `useDirection`: `boolean`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `spread`: `number`; `type`: `"radial"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `rotation`: `number`; `spread`: `number`; `type`: `"vortex"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number`; `seed`: `number`; `speed`: `number`; `spread`: `number`; `type`: `"noise"`; \})[]; `orientation`: `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"`; `overLifetime`: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \}; `playMode`: `"once"` \| `"loop"`; `position`: \{ `x`: `number`; `y`: `number`; \}; `rendering`: \{ `blendMode`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \}; `rotation`: `number`; `scale`: `number`; `seed`: `number`; `space`: `"world"` \| `"local"`; `startDelay`: `number`; `startDelaySpread`: `number`; `startOffset`: `number`; `stretchWithVelocity`: `boolean`; \} | `undefined` |
| `definition.capacity?` | `number` | `...` |
| `definition.duration?` | `number` | `...` |
| `definition.durationSpread?` | `number` | `...` |
| `definition.emission?` | \{ `rate`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \}; \} | `emissionSchema` |
| `definition.emission.rate?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `emissionRateSchema` |
| `definition.emission.rateSpread?` | `number` | `...` |
| `definition.emission.shape?` | \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} | `emissionShapeSchema` |
| `definition.id?` | `string` | `emitterIdSchema` |
| `definition.inheritVelocity?` | `number` | `...` |
| `definition.initial?` | \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread`: `number`; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread`: `number`; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread`: `number`; `direction`: `number`; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread`: `number`; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread`: `number`; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread`: `number`; `size`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread`: `number`; `spread`: `number`; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread`: `number`; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread`: `number`; \} | `initialPropertiesSchema` |
| `definition.initial.alpha?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.alphaSpread?` | `number` | `...` |
| `definition.initial.angularVelocity?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.angularVelocitySpread?` | `number` | `...` |
| `definition.initial.blue?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.blueSpread?` | `number` | `...` |
| `definition.initial.direction?` | `number` | `...` |
| `definition.initial.green?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.greenSpread?` | `number` | `...` |
| `definition.initial.lifetime?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `scalarPropertySchema` |
| `definition.initial.lifetimeSpread?` | `number` | `...` |
| `definition.initial.red?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.redSpread?` | `number` | `...` |
| `definition.initial.rotation?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.rotationSpread?` | `number` | `...` |
| `definition.initial.size?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.sizeSpread?` | `number` | `...` |
| `definition.initial.speed?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `scalarPropertySchema` |
| `definition.initial.speedSpread?` | `number` | `...` |
| `definition.initial.spread?` | `number` | `...` |
| `definition.initial.stretchX?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.stretchXSpread?` | `number` | `...` |
| `definition.initial.stretchY?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.initial.stretchYSpread?` | `number` | `...` |
| `definition.modifiers?` | (\{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"drag"`; `useDirection`: `boolean`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `spread`: `number`; `type`: `"radial"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `rotation`: `number`; `spread`: `number`; `type`: `"vortex"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number`; `seed`: `number`; `speed`: `number`; `spread`: `number`; `type`: `"noise"`; \})[] | `...` |
| `definition.orientation?` | `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"` | `...` |
| `definition.overLifetime?` | \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \} | `overLifetimeSchema` |
| `definition.overLifetime.alpha?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.overLifetime.angularVelocity?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.overLifetime.blue?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.overLifetime.green?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.overLifetime.red?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.overLifetime.rotation?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.overLifetime.scale?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.overLifetime.stretchX?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.overLifetime.stretchY?` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `...` |
| `definition.playMode?` | `"once"` \| `"loop"` | `...` |
| `definition.position?` | \{ `x`: `number`; `y`: `number`; \} | `...` |
| `definition.position.x?` | `number` | `...` |
| `definition.position.y?` | `number` | `...` |
| `definition.rendering?` | \{ `blendMode`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \} | `renderingSchema` |
| `definition.rendering.blendMode?` | `"normal"` \| `"add"` \| `"multiply"` \| `"screen"` | `...` |
| `definition.rendering.tint?` | \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \} | `...` |
| `definition.rendering.tint.alpha?` | `number` | `...` |
| `definition.rendering.tint.blue?` | `number` | `...` |
| `definition.rendering.tint.green?` | `number` | `...` |
| `definition.rendering.tint.red?` | `number` | `...` |
| `definition.rotation?` | `number` | `...` |
| `definition.scale?` | `number` | `...` |
| `definition.seed?` | `number` | `...` |
| `definition.space?` | `"world"` \| `"local"` | `...` |
| `definition.startDelay?` | `number` | `...` |
| `definition.startDelaySpread?` | `number` | `...` |
| `definition.startOffset?` | `number` | `...` |
| `definition.stretchWithVelocity?` | `boolean` | `...` |
| `sharedModifiers?` | `unknown` | `[]` |
| `effectTransform?` | [`EffectTransform`](../EffectTransform/) | `...` |

#### Returns

`EmitterController`\<`T`\>

## Properties

### capacity

> `readonly` **capacity**: `number`

***

### effectTransform

> `readonly` **effectTransform**: [`EffectTransform`](../EffectTransform/)

***

### emitting

> **emitting**: `boolean` = `true`

Gate new births without pausing the simulation or resetting playback.

## Accessors

### birthTexture

#### Get Signature

> **get** **birthTexture**(): `T`

Borrowed birth-data texture for renderer adapters: three RGBA bands.

##### Returns

`T`

***

### configuration

#### Get Signature

> **get** **configuration**(): \{ `capacity`: `number`; `duration`: `number`; `durationSpread`: `number`; `emission`: \{ `rate`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \}; \}; `id`: `string`; `inheritVelocity`: `number`; `initial`: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread`: `number`; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread`: `number`; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread`: `number`; `direction`: `number`; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread`: `number`; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread`: `number`; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread`: `number`; `size`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread`: `number`; `spread`: `number`; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread`: `number`; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread`: `number`; \}; `modifiers`: (\{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"drag"`; `useDirection`: `boolean`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `spread`: `number`; `type`: `"radial"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `rotation`: `number`; `spread`: `number`; `type`: `"vortex"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number`; `seed`: `number`; `speed`: `number`; `spread`: `number`; `type`: `"noise"`; \})[]; `orientation`: `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"`; `overLifetime`: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \}; `playMode`: `"once"` \| `"loop"`; `position`: \{ `x`: `number`; `y`: `number`; \}; `rendering`: \{ `blendMode`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \}; `rotation`: `number`; `scale`: `number`; `seed`: `number`; `space`: `"world"` \| `"local"`; `startDelay`: `number`; `startDelaySpread`: `number`; `startOffset`: `number`; `stretchWithVelocity`: `boolean`; \}

Owned snapshot for serialization or explicit recreation.

##### Returns

\{ `capacity`: `number`; `duration`: `number`; `durationSpread`: `number`; `emission`: \{ `rate`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \}; \}; `id`: `string`; `inheritVelocity`: `number`; `initial`: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread`: `number`; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread`: `number`; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread`: `number`; `direction`: `number`; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread`: `number`; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread`: `number`; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread`: `number`; `size`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread`: `number`; `spread`: `number`; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread`: `number`; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread`: `number`; \}; `modifiers`: (\{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"drag"`; `useDirection`: `boolean`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `spread`: `number`; `type`: `"radial"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `rotation`: `number`; `spread`: `number`; `type`: `"vortex"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number`; `seed`: `number`; `speed`: `number`; `spread`: `number`; `type`: `"noise"`; \})[]; `orientation`: `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"`; `overLifetime`: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \}; `playMode`: `"once"` \| `"loop"`; `position`: \{ `x`: `number`; `y`: `number`; \}; `rendering`: \{ `blendMode`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \}; `rotation`: `number`; `scale`: `number`; `seed`: `number`; `space`: `"world"` \| `"local"`; `startDelay`: `number`; `startDelaySpread`: `number`; `startOffset`: `number`; `stretchWithVelocity`: `boolean`; \}

###### capacity

> **capacity**: `number`

###### duration

> **duration**: `number`

###### durationSpread

> **durationSpread**: `number`

###### emission

> **emission**: \{ `rate`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \}; \} = `emissionSchema`

###### emission.rate

> **rate**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `emissionRateSchema`

###### emission.rateSpread

> **rateSpread**: `number`

###### emission.shape

> **shape**: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} = `emissionShapeSchema`

###### id

> **id**: `string` = `emitterIdSchema`

###### inheritVelocity

> **inheritVelocity**: `number`

###### initial

> **initial**: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread`: `number`; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread`: `number`; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread`: `number`; `direction`: `number`; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread`: `number`; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread`: `number`; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread`: `number`; `size`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread`: `number`; `spread`: `number`; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread`: `number`; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread`: `number`; \} = `initialPropertiesSchema`

###### initial.alpha

> **alpha**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.alphaSpread

> **alphaSpread**: `number`

###### initial.angularVelocity

> **angularVelocity**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.angularVelocitySpread

> **angularVelocitySpread**: `number`

###### initial.blue

> **blue**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.blueSpread

> **blueSpread**: `number`

###### initial.direction

> **direction**: `number`

###### initial.green

> **green**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.greenSpread

> **greenSpread**: `number`

###### initial.lifetime

> **lifetime**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `scalarPropertySchema`

###### initial.lifetimeSpread

> **lifetimeSpread**: `number`

###### initial.red

> **red**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.redSpread

> **redSpread**: `number`

###### initial.rotation

> **rotation**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.rotationSpread

> **rotationSpread**: `number`

###### initial.size

> **size**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.sizeSpread

> **sizeSpread**: `number`

###### initial.speed

> **speed**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `scalarPropertySchema`

###### initial.speedSpread

> **speedSpread**: `number`

###### initial.spread

> **spread**: `number`

###### initial.stretchX

> **stretchX**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.stretchXSpread

> **stretchXSpread**: `number`

###### initial.stretchY

> **stretchY**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### initial.stretchYSpread

> **stretchYSpread**: `number`

###### modifiers

> **modifiers**: (\{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"drag"`; `useDirection`: `boolean`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `spread`: `number`; `type`: `"radial"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `rotation`: `number`; `spread`: `number`; `type`: `"vortex"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number`; `seed`: `number`; `speed`: `number`; `spread`: `number`; `type`: `"noise"`; \})[]

###### orientation

> **orientation**: `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"`

###### overLifetime

> **overLifetime**: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \} = `overLifetimeSchema`

###### overLifetime.alpha

> **alpha**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### overLifetime.angularVelocity

> **angularVelocity**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### overLifetime.blue

> **blue**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### overLifetime.green

> **green**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### overLifetime.red

> **red**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### overLifetime.rotation

> **rotation**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### overLifetime.scale

> **scale**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### overLifetime.stretchX

> **stretchX**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### overLifetime.stretchY

> **stretchY**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

###### playMode

> **playMode**: `"once"` \| `"loop"`

###### position

> **position**: \{ `x`: `number`; `y`: `number`; \}

###### position.x

> **x**: `number`

###### position.y

> **y**: `number`

###### rendering

> **rendering**: \{ `blendMode`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \} = `renderingSchema`

###### rendering.blendMode

> **blendMode**: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`

###### rendering.tint?

> `optional` **tint?**: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}

###### rendering.tint.alpha

> **alpha**: `number`

###### rendering.tint.blue

> **blue**: `number`

###### rendering.tint.green

> **green**: `number`

###### rendering.tint.red

> **red**: `number`

###### rotation

> **rotation**: `number`

###### scale

> **scale**: `number`

###### seed

> **seed**: `number`

###### space

> **space**: `"world"` \| `"local"`

###### startDelay

> **startDelay**: `number`

###### startDelaySpread

> **startDelaySpread**: `number`

###### startOffset

> **startOffset**: `number`

###### stretchWithVelocity

> **stretchWithVelocity**: `boolean`

***

### id

#### Get Signature

> **get** **id**(): `string`

##### Returns

`string`

***

### initialized

#### Get Signature

> **get** **initialized**(): `boolean`

##### Returns

`boolean`

***

### isEmitting

#### Get Signature

> **get** **isEmitting**(): `boolean`

Emission eligibility at the current clock, before any pending prewarm.

##### Returns

`boolean`

***

### particleCount

#### Get Signature

> **get** **particleCount**(): `number`

Number of living particles tracked on the CPU; no GPU readback.

##### Returns

`number`

***

### rotation

#### Get Signature

> **get** **rotation**(): `number`

Emitter rotation in counterclockwise degrees.

##### Returns

`number`

#### Set Signature

> **set** **rotation**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### rows

#### Get Signature

> **get** **rows**(): `number`

Rows in each of the five particle-state bands.

##### Returns

`number`

***

### scale

#### Get Signature

> **get** **scale**(): `number`

Uniform emitter scale; independent of particle size curves.

##### Returns

`number`

#### Set Signature

> **set** **scale**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### space

#### Get Signature

> **get** **space**(): `"world"` \| `"local"`

##### Returns

`"world"` \| `"local"`

***

### state

#### Get Signature

> **get** **state**(): [`EmitterState`](../../types/EmitterState/)

##### Returns

[`EmitterState`](../../types/EmitterState/)

***

### stretchWithVelocity

#### Get Signature

> **get** **stretchWithVelocity**(): `boolean`

Whether Y stretch follows the current simulation speed.

##### Returns

`boolean`

***

### texture

#### Get Signature

> **get** **texture**(): `T`

Borrowed changing-state texture for renderer adapters: two RGBA bands.

##### Returns

`T`

***

### width

#### Get Signature

> **get** **width**(): `number`

Texture columns; finalized against device limits when initialized.

##### Returns

`number`

***

### worldHandedness

#### Get Signature

> **get** **worldHandedness**(): `-1` \| `1`

##### Returns

`-1` \| `1`

***

### worldRotation

#### Get Signature

> **get** **worldRotation**(): `number`

##### Returns

`number`

***

### worldScale

#### Get Signature

> **get** **worldScale**(): `number`

##### Returns

`number`

***

### worldX

#### Get Signature

> **get** **worldX**(): `number`

##### Returns

`number`

***

### worldY

#### Get Signature

> **get** **worldY**(): `number`

##### Returns

`number`

***

### x

#### Get Signature

> **get** **x**(): `number`

Emitter origin in effect coordinates; rotation and scale apply around this point.

##### Returns

`number`

#### Set Signature

> **set** **x**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### y

#### Get Signature

> **get** **y**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **y**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

## Methods

### clear()

> **clear**(): `void`

Stop emission and remove all particles immediately.

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Release owned resources once, leaving the shared WebGL context alive.

#### Returns

`void`

***

### initialize()

> **initialize**(`context`): `void`

Attach the renderer's context once. CPU controls are usable before attachment.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`SimulationContext`](../../interfaces/SimulationContext/)\<`T`\> |

#### Returns

`void`

***

### onStateChange()

> **onStateChange**(`listener`): () => `void`

Subscribe to queued lifecycle transitions; returns an unsubscribe function.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | [`EmitterStateListener`](../../types/EmitterStateListener/) |

#### Returns

() => `void`

***

### play()

> **play**(): `void`

Restart from the initial state, including delay, seed and prewarm.

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Clear particles and restore the initial clock and seed; preserve the emitting gate.

#### Returns

`void`

***

### retire()

> **retire**(): `void`

Finish the current cycle, then drain existing particles.

#### Returns

`void`

***

### setParameters()

> **setParameters**(`patch`): `void`

Apply a validated patch atomically, rebuilding only affected sampled data.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patch` | \{ `emission?`: \{ `rate?`: `number`; `shape?`: \{ `diameter?`: `number`; `diameterSpread?`: `number`; `height?`: `number`; `heightSpread?`: `number`; `width?`: `number`; `widthSpread?`: `number`; \}; \}; `inheritVelocity?`: `number`; `initial?`: \{ `alpha?`: `number`; `alphaSpread?`: `number`; `angularVelocity?`: `number`; `angularVelocitySpread?`: `number`; `blue?`: `number`; `blueSpread?`: `number`; `direction?`: `number`; `green?`: `number`; `greenSpread?`: `number`; `lifetime?`: `number`; `lifetimeSpread?`: `number`; `red?`: `number`; `redSpread?`: `number`; `rotation?`: `number`; `rotationSpread?`: `number`; `size?`: `number`; `sizeSpread?`: `number`; `speed?`: `number`; `speedSpread?`: `number`; `spread?`: `number`; `stretchX?`: `number`; `stretchXSpread?`: `number`; `stretchY?`: `number`; `stretchYSpread?`: `number`; \}; `modifiers?`: (\{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"drag"`; `useDirection?`: `boolean`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `spread?`: `number`; `type`: `"radial"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `rotation?`: `number`; `spread?`: `number`; `type`: `"vortex"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale?`: `number`; `seed?`: `number`; `speed?`: `number`; `spread?`: `number`; `type`: `"noise"`; \})[]; `position?`: \{ `x?`: `number`; `y?`: `number`; \}; `rotation?`: `number`; `scale?`: `number`; `stretchWithVelocity?`: `boolean`; \} |
| `patch.emission?` | \{ `rate?`: `number`; `shape?`: \{ `diameter?`: `number`; `diameterSpread?`: `number`; `height?`: `number`; `heightSpread?`: `number`; `width?`: `number`; `widthSpread?`: `number`; \}; \} |
| `patch.emission.rate?` | `number` |
| `patch.emission.shape?` | \{ `diameter?`: `number`; `diameterSpread?`: `number`; `height?`: `number`; `heightSpread?`: `number`; `width?`: `number`; `widthSpread?`: `number`; \} |
| `patch.emission.shape.diameter?` | `number` |
| `patch.emission.shape.diameterSpread?` | `number` |
| `patch.emission.shape.height?` | `number` |
| `patch.emission.shape.heightSpread?` | `number` |
| `patch.emission.shape.width?` | `number` |
| `patch.emission.shape.widthSpread?` | `number` |
| `patch.inheritVelocity?` | `number` |
| `patch.initial?` | \{ `alpha?`: `number`; `alphaSpread?`: `number`; `angularVelocity?`: `number`; `angularVelocitySpread?`: `number`; `blue?`: `number`; `blueSpread?`: `number`; `direction?`: `number`; `green?`: `number`; `greenSpread?`: `number`; `lifetime?`: `number`; `lifetimeSpread?`: `number`; `red?`: `number`; `redSpread?`: `number`; `rotation?`: `number`; `rotationSpread?`: `number`; `size?`: `number`; `sizeSpread?`: `number`; `speed?`: `number`; `speedSpread?`: `number`; `spread?`: `number`; `stretchX?`: `number`; `stretchXSpread?`: `number`; `stretchY?`: `number`; `stretchYSpread?`: `number`; \} |
| `patch.initial.alpha?` | `number` |
| `patch.initial.alphaSpread?` | `number` |
| `patch.initial.angularVelocity?` | `number` |
| `patch.initial.angularVelocitySpread?` | `number` |
| `patch.initial.blue?` | `number` |
| `patch.initial.blueSpread?` | `number` |
| `patch.initial.direction?` | `number` |
| `patch.initial.green?` | `number` |
| `patch.initial.greenSpread?` | `number` |
| `patch.initial.lifetime?` | `number` |
| `patch.initial.lifetimeSpread?` | `number` |
| `patch.initial.red?` | `number` |
| `patch.initial.redSpread?` | `number` |
| `patch.initial.rotation?` | `number` |
| `patch.initial.rotationSpread?` | `number` |
| `patch.initial.size?` | `number` |
| `patch.initial.sizeSpread?` | `number` |
| `patch.initial.speed?` | `number` |
| `patch.initial.speedSpread?` | `number` |
| `patch.initial.spread?` | `number` |
| `patch.initial.stretchX?` | `number` |
| `patch.initial.stretchXSpread?` | `number` |
| `patch.initial.stretchY?` | `number` |
| `patch.initial.stretchYSpread?` | `number` |
| `patch.modifiers?` | (\{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"drag"`; `useDirection?`: `boolean`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `spread?`: `number`; `type`: `"radial"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `rotation?`: `number`; `spread?`: `number`; `type`: `"vortex"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale?`: `number`; `seed?`: `number`; `speed?`: `number`; `spread?`: `number`; `type`: `"noise"`; \})[] |
| `patch.position?` | \{ `x?`: `number`; `y?`: `number`; \} |
| `patch.position.x?` | `number` |
| `patch.position.y?` | `number` |
| `patch.rotation?` | `number` |
| `patch.scale?` | `number` |
| `patch.stretchWithVelocity?` | `boolean` |

#### Returns

`void`

***

### stop()

> **stop**(`__namedParameters?`): `void`

Stop spawning; existing particles drain unless clear is requested.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters?` | [`StopOptions`](../../interfaces/StopOptions/) |

#### Returns

`void`

***

### update()

> **update**(`seconds`): `void`

Advance by 0–0.1 seconds. The first positive step runs pending prewarm first.
Before initialize(), updates leave playback paused without accumulating time.
Zero-time updates initialize GPU output without advancing particle ages.
State notifications are delivered after the simulation work completes.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `seconds` | `number` |

#### Returns

`void`
