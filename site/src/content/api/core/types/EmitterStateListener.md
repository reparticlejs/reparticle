---
title: "EmitterStateListener"
description: "Receive transitions in order, without an initial event when subscribing.\nUpdates deliver notifications after simulation work; stop/reset also flush\ntransitions. Changes made inside a listener wait until the current batch ends.\nA callback may observe a newer emitter.state than event.state\nwhen several transitions occurred during one update, including prewarm."
package: "core"
---

> **EmitterStateListener** = (`event`) => `void`

Receive transitions in order, without an initial event when subscribing.
Updates deliver notifications after simulation work; stop/reset also flush
transitions. Changes made inside a listener wait until the current batch ends.
A callback may observe a newer emitter.state than event.state
when several transitions occurred during one update, including prewarm.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | [`EmitterStateChange`](../../interfaces/EmitterStateChange/) |

## Returns

`void`
