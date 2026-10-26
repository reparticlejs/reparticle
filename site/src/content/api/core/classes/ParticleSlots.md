---
title: "ParticleSlots"
description: "Allocate fixed GPU slots using CPU lifetime metadata, without texture readbacks.\nBirths from one step share an age and form a batch sorted by lifetime. This\nlets expiration consume each batch from the front instead of scanning capacity.\nLiving slots are never overwritten; requests beyond available capacity are dropped."
package: "core"
---

Allocate fixed GPU slots using CPU lifetime metadata, without texture readbacks.
Births from one step share an age and form a batch sorted by lifetime. This
lets expiration consume each batch from the front instead of scanning capacity.
Living slots are never overwritten; requests beyond available capacity are dropped.

## Constructors

### Constructor

> **new ParticleSlots**(`capacity`): `ParticleSlots`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `capacity` | `number` |

#### Returns

`ParticleSlots`

## Properties

### spawnMask

> `readonly` **spawnMask**: `Float32Array`

Packed birth flags for the current step: one bit per newly admitted slot.

## Accessors

### count

#### Get Signature

> **get** **count**(): `number`

##### Returns

`number`

***

### empty

#### Get Signature

> **get** **empty**(): `boolean`

##### Returns

`boolean`

## Methods

### advance()

> **advance**(`seconds`, `requested`, `lifetime`, `spread`, `seed`): `number`

Advance existing particles and admit births into free slots.
Returns the accepted birth count. Excess requests are dropped, never queued.
Lifetimes and ages use float32 rounding to match GPU expiration decisions.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `seconds` | `number` |
| `requested` | `number` |
| `lifetime` | `number` |
| `spread` | `number` |
| `seed` | `number` |

#### Returns

`number`

***

### forEachLifetime()

> **forEachLifetime**(`visitor`): `void`

Visit only live allocation metadata; no particle texture is inspected.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `visitor` | [`ParticleLifetimeVisitor`](../../types/ParticleLifetimeVisitor/) |

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Clear all allocations and restore ascending slot allocation order.

#### Returns

`void`
