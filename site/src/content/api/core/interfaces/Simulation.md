---
title: "Simulation"
description: "Storage and stepping owned by one backend; playback stays in the shared emitter."
package: "core"
---

Storage and stepping owned by one backend; playback stays in the shared emitter.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="t"></a> `T` |

## Properties

### birthTexture

> `readonly` **birthTexture**: `T`

***

### texture

> `readonly` **texture**: `T`

## Methods

### clear()

> **clear**(): `void`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

#### Returns

`void`

***

### update()

> **update**(`parameters`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `parameters` | `SimulationParameters` |

#### Returns

`void`
