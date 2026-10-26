---
title: "ParticleLifetimeVisitor"
description: "Synchronous callback used by ParticleSlots.forEachLifetime() for each live slot.\nValues come from CPU allocation metadata; visiting does not read GPU textures\nor allocate a per-particle record. Traversal follows birth batches, not draw order."
package: "core"
---

> **ParticleLifetimeVisitor** = (`slot`, `age`, `lifetime`, `generation`) => `void`

Synchronous callback used by ParticleSlots.forEachLifetime() for each live slot.
Values come from CPU allocation metadata; visiting does not read GPU textures
or allocate a per-particle record. Traversal follows birth batches, not draw order.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `slot` | `number` | Fixed GPU slot index, reusable after its particle expires. |
| `age` | `number` | Elapsed seconds, rounded to float32 to match simulation timing. Newborns already include their birth step, even if their lifetime is nonpositive. |
| `lifetime` | `number` | Sampled particle lifespan in seconds, including birth spread. Equality with age remains alive; newborns are retained for their birth frame. |
| `generation` | `number` | Allocation revision captured at birth, shared by that step's births. Combine it with slot to distinguish reuse within one ParticleSlots instance; it is not a globally unique particle ID. |

## Returns

`void`
