---
title: "propertyVariation"
description: "Source-generated API for propertyVariation in @reparticle/core."
package: "core"
---

> **propertyVariation**(`particleId`, `seed`, `stream`): `number`

Produce repeatable variation in [-1, 1] for a particle property.

Callers use `base + variation * spread`. A stable stream ID gives each
property (speed, lifetime, color, etc.) a separate sequence for the same
particle slot and seed, without maintaining random-generator state.

With runtime seeds in [0, 65535] and the assigned property streams, integer
mixing stays below 2^24, where float32 represents integers exactly. CPU
lifetime tracking and GPU spawning therefore use the same integer hash.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `particleId` | `number` |
| `seed` | `number` |
| `stream` | `number` |

## Returns

`number`
