---
title: "SpawnSchedule"
description: "Convert a particles-per-second rate into whole-particle requests per step.\nFractional births carry into later steps; whole births above capacity are dropped.\nParticleSlots separately decides how many requests fit in currently free slots."
package: "core"
---

Convert a particles-per-second rate into whole-particle requests per step.
Fractional births carry into later steps; whole births above capacity are dropped.
ParticleSlots separately decides how many requests fit in currently free slots.

## Constructors

### Constructor

> **new SpawnSchedule**(`capacity`): `SpawnSchedule`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `capacity` | `number` |

#### Returns

`SpawnSchedule`

## Properties

### capacity

> `readonly` **capacity**: `number`

## Methods

### next()

> **next**(`rate`, `seconds`): `number`

Request births for this step. Invalid input leaves the carried fraction unchanged.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rate` | `number` |
| `seconds` | `number` |

#### Returns

`number`

***

### reset()

> **reset**(): `void`

Discard the carried fraction when playback restarts.

#### Returns

`void`
