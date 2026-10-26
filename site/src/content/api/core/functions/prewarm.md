---
title: "prewarm"
description: "Source-generated API for prewarm in @reparticle/core."
package: "core"
---

> **prewarm**(`startOffset`, `maximumLifetime`, `advance`): `void`

Simulate an effect's start offset before its first visible frame.
The caller supplies the normal simulation step, including delay and playback
handling, so prewarming can also complete a once-playing emitter.

Simulated time is capped at the maximum particle lifetime. Every step is a
full 1/60 second, even when less time remains; the final step may overshoot.
This fixed startup step is independent of the display's refresh rate.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `startOffset` | `number` |
| `maximumLifetime` | `number` |
| `advance` | (`seconds`) => `void` |

## Returns

`void`
