---
title: "EmitterPlayback"
description: "Frame-based emission clock, independent of individual particle ages.\nLifecycle: prespawn (delay) → spawning → postspawn (draining) → sleeping.\nLoop boundaries stay in spawning. The caller reports when particles have\ndrained through finish(); this class does not track particle counts."
package: "core"
---

Frame-based emission clock, independent of individual particle ages.
Lifecycle: prespawn (delay) → spawning → postspawn (draining) → sleeping.
Loop boundaries stay in spawning. The caller reports when particles have
drained through finish(); this class does not track particle counts.

## Constructors

### Constructor

> **new EmitterPlayback**(`authoredDuration`, `playMode`, `startDelay?`, `__namedParameters?`): `EmitterPlayback`

#### Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `authoredDuration` | `number` | `undefined` |
| `playMode` | `"once"` \| `"loop"` | `undefined` |
| `startDelay?` | `number` | `0` |
| `__namedParameters?` | `PlaybackVariation` | `{}` |

#### Returns

`EmitterPlayback`

## Properties

### emissionEndAge

> **emissionEndAge**: `number` = `0`

***

### emissionStartAge

> **emissionStartAge**: `number` = `0`

Normalized interval consumed by the last emitting step, before loop wrapping.

## Accessors

### emitting

#### Get Signature

> **get** **emitting**(): `boolean`

Whether the next positive-time step is eligible to emit particles.

##### Returns

`boolean`

***

### modifierAge

#### Get Signature

> **get** **modifierAge**(): `number`

Modifiers use the authored duration, even when spread extends the sampled clock.

##### Returns

`number`

***

### normalizedAge

#### Get Signature

> **get** **normalizedAge**(): `number`

Current emitter age after delay and loop handling; zero duration samples the start.

##### Returns

`number`

***

### state

#### Get Signature

> **get** **state**(): [`EmitterState`](../../types/EmitterState/)

##### Returns

[`EmitterState`](../../types/EmitterState/)

## Methods

### advance()

> **advance**(`seconds`): `boolean`

Advance one step and return whether that entire step should emit.
A step that crosses the delay still waits; emission starts on the next step.
A step that reaches duration still emits, even if it stops or wraps the clock.
Zero-time initialization and sleeping never advance the clock or emit.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `seconds` | `number` |

#### Returns

`boolean`

***

### finish()

> **finish**(`empty`): `void`

Enter sleeping only after emission has stopped and the caller reports no particles.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `empty` | `boolean` |

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Restart the delay and cancel stop/retirement, keeping the sampled timing values.

#### Returns

`void`

***

### retire()

> **retire**(): `void`

Disable the next loop without changing the current clock or state.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Stop births immediately; existing particles may continue draining.

#### Returns

`void`

***

### takeTransitions()

> **takeTransitions**(): [`EmitterState`](../../types/EmitterState/)[]

Drain queued state changes in order; repeated states do not enqueue events.

#### Returns

[`EmitterState`](../../types/EmitterState/)[]
