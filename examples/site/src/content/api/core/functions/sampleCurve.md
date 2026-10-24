---
title: "sampleCurve"
description: "Source-generated API for sampleCurve in @reparticle/core."
package: "core"
---

> **sampleCurve**(`property`): `Float32Array`

Bake a constant or validated curve into 65 evenly spaced float32 values.
Includes both endpoints: time 0 at index 0 and time 1 at index 64.
Playback interpolates between adjacent samples instead of evaluating Hermite
curves each frame. Constants produce the same value at every sample.

Throws if a sampled value is nonfinite or overflows float32 storage.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `property` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} |

## Returns

`Float32Array`
