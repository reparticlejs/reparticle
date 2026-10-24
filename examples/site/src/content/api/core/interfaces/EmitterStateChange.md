---
title: "EmitterStateChange"
description: "One queued playback transition, identified by the emitter's configured ID."
package: "core"
---

One queued playback transition, identified by the emitter's configured ID.

## Properties

### emitterId

> **emitterId**: `string`

Identifies the source when subscribing to multiple emitters.

***

### state

> **state**: [`EmitterState`](../../types/EmitterState/)

State entered by this transition; later queued transitions may already exist.
