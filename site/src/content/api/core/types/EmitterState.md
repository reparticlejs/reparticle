---
title: "EmitterState"
description: "Emitter playback phase, independent of its emission gate and particle count.\n\n- prespawn: initial or reset state, waiting to begin after the start delay.\n- spawning: emission cycle is running, even when rate or the emission gate is zero.\n- postspawn: emission has stopped; existing particles may still be draining.\n- sleeping: emission has stopped and a simulation step confirmed no particles remain.\n\nLoop boundaries stay in spawning. These states do not indicate destruction."
package: "core"
---

> **EmitterState** = `"prespawn"` \| `"spawning"` \| `"postspawn"` \| `"sleeping"`

Emitter playback phase, independent of its emission gate and particle count.

- prespawn: initial or reset state, waiting to begin after the start delay.
- spawning: emission cycle is running, even when rate or the emission gate is zero.
- postspawn: emission has stopped; existing particles may still be draining.
- sleeping: emission has stopped and a simulation step confirmed no particles remain.

Loop boundaries stay in spawning. These states do not indicate destruction.
