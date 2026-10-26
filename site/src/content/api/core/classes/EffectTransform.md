---
title: "EffectTransform"
description: "Shared transform from effect-local coordinates to world coordinates.\nReflect local X when handedness is -1, then rotate, scale, and translate.\nRotation is in degrees, counterclockwise on a canvas whose Y axis points down."
package: "core"
---

Shared transform from effect-local coordinates to world coordinates.
Reflect local X when handedness is -1, then rotate, scale, and translate.
Rotation is in degrees, counterclockwise on a canvas whose Y axis points down.

## Constructors

### Constructor

> **new EffectTransform**(): `EffectTransform`

#### Returns

`EffectTransform`

## Accessors

### handedness

#### Get Signature

> **get** **handedness**(): `-1` \| `1`

1 preserves orientation; -1 reflects the local X axis.

##### Returns

`-1` \| `1`

#### Set Signature

> **set** **handedness**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `-1` \| `1` |

##### Returns

`void`

***

### rotation

#### Get Signature

> **get** **rotation**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **rotation**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### scale

#### Get Signature

> **get** **scale**(): `number`

Uniform scale; zero collapses to the origin, negative values invert both axes.

##### Returns

`number`

#### Set Signature

> **set** **scale**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### x

#### Get Signature

> **get** **x**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **x**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

***

### y

#### Get Signature

> **get** **y**(): `number`

##### Returns

`number`

#### Set Signature

> **set** **y**(`value`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `number` |

##### Returns

`void`

## Methods

### applyX()

> **applyX**(`localX`, `localY`): `number`

World X of a local point. Returns one coordinate without allocating a point object.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `localX` | `number` |
| `localY` | `number` |

#### Returns

`number`

***

### applyY()

> **applyY**(`localX`, `localY`): `number`

World Y of a local point, using the same transform order as applyX.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `localX` | `number` |
| `localY` | `number` |

#### Returns

`number`

***

### set()

> **set**(`patch`): `void`

Validate the entire patch before committing; rejected patches leave all values intact.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `patch` | `Partial`\<[`Transform`](../../interfaces/Transform/)\> |

#### Returns

`void`
