---
title: "SampledCurve"
description: "Samples a constant or authored curve once, then interpolates between cached\nvalues during playback. Times are normalized: 0 is the start, 1 is the end."
package: "core"
---

Samples a constant or authored curve once, then interpolates between cached
values during playback. Times are normalized: 0 is the start, 1 is the end.

## Constructors

### Constructor

> **new SampledCurve**(`property`): `SampledCurve`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `property` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} |

#### Returns

`SampledCurve`

## Accessors

### maximum

#### Get Signature

> **get** **maximum**(): `number`

Largest stored sample; not the exact maximum of the original Hermite curve.

##### Returns

`number`

## Methods

### at()

> **at**(`normalizedTime`): `number`

Evaluate within [0, 1], holding the endpoint value outside that range.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `normalizedTime` | `number` |

#### Returns

`number`

***

### extrapolate()

> **extrapolate**(`normalizedTime`): `number`

Hold the first sample before time 0, but extend the final straight segment
after time 1. Modifier curves use this when their playback time exceeds one.
This extends the sampled line, not the original Hermite polynomial.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `normalizedTime` | `number` |

#### Returns

`number`
