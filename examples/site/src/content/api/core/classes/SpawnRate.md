---
title: "SpawnRate"
description: "Evaluate births per second over emitter lifetime, not individual particle age.\nA seeded spread offset is sampled once and stays fixed across evaluations.\nSpawnSchedule converts the resulting rate into a whole-particle request."
package: "core"
---

Evaluate births per second over emitter lifetime, not individual particle age.
A seeded spread offset is sampled once and stays fixed across evaluations.
SpawnSchedule converts the resulting rate into a whole-particle request.

## Constructors

### Constructor

> **new SpawnRate**(`rate`, `spread?`, `seed?`): `SpawnRate`

Spread is an absolute half-range in particles per second, not a percentage.

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `rate` | `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} | `undefined` |
| `spread?` | `number` | `0` |
| `seed?` | `number` | `0` |

#### Returns

`SpawnRate`

## Methods

### at()

> **at**(`normalizedEmitterAge`): `number`

Read the curve at normalized emitter age (0–1), then add spread and clamp.
Clamping happens last so a positive offset can lift a negative curve value.
Times outside the range use the curve's endpoint values.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `normalizedEmitterAge` | `number` |

#### Returns

`number`

***

### average()

> **average**(`start`, `end`): `number`

Average the nonnegative rate across a step, including every crossed curve segment.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `start` | `number` |
| `end` | `number` |

#### Returns

`number`
