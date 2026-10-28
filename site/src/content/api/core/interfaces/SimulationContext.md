---
title: "SimulationContext"
description: "Renderer adapter supplies the matching simulation without importing another backend."
package: "core"
---

Renderer adapter supplies the matching simulation without importing another backend.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="t"></a> `T` |

## Properties

### assertAvailable?

> `optional` **assertAvailable?**: () => `void`

#### Returns

`void`

***

### identity

> **identity**: `object`

***

### maxTextureSize

> **maxTextureSize**: `number`

***

### restoreState?

> `optional` **restoreState?**: () => `void`

#### Returns

`void`

## Methods

### batchUpdates()?

> `optional` **batchUpdates**(`updates`): `void`

Group synchronous updates; completed work is submitted before returning.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `updates` | () => `void` |

#### Returns

`void`

***

### createSimulation()

> **createSimulation**(`width`, `rows`, `capacity`): [`Simulation`](../Simulation/)\<`T`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `width` | `number` |
| `rows` | `number` |
| `capacity` | `number` |

#### Returns

[`Simulation`](../Simulation/)\<`T`\>

***

### flush()?

> `optional` **flush**(): `void`

Publish pending commands before invoking user callbacks.

#### Returns

`void`
