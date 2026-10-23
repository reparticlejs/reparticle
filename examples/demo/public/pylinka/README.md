# Pylinka examples

Effects adapted from [Pylinka recipes](https://github.com/schmooky/pylinka/blob/d736f8651db9dbd221f34e3eabf4ce88e7d320fe/apps/site/src/recipes/data.ts), under the included MIT license.

Compact effects use emitter scale 4 for visibility. Wide fields use scale 1 with larger sprites to keep their authored footprint visible. Large flipbooks use 2× sprite sizing. Full-width falling effects start at the top; rising fields start at the bottom.

Only existing Reparticle features are used. Effects requiring turbulence, collisions, emission masks, subemitters, or instantaneous bursts are deferred.

## Ember Rise

A wide bed of small orange embers rising and fading. Preserves the 140 × 20 box, 110 particles/second, 1.2–2.2 second lifetime, 40–95 units/second upward birth speed, upward acceleration of 25 units/s², drag 0.5, and additive blend. Sine-out size and color transitions are approximated with five Hermite curve points. Prewarms for 2.2 seconds.

Our box emits straight upward, so the source's small independent sideways velocity (±6 units/second) is omitted. Uses the existing soft particle blob.

## Supported collection

17 of the 90 source recipes are currently included; the gallery has been curated down from the original port collection. These are visual adaptations using existing engine APIs, not pixel-identical ports. All effect JSON remains separate from Pixi artwork and playback bindings. No simulation or renderer features were added.

| Group    | Included effects                                 |
| -------- | ------------------------------------------------ |
| abstract | Ease Pop, Nebula                                 |
| trails   | Coin Spark Trail, Infinity Loop                  |
| fire     | Ember Rise                                       |
| magic    | Star Sparkle, Stardust Fall                      |
| ambient  | Rain                                             |
| ui       | Coin Shower, Coin Fountain                       |
| swirl    | Black Hole, Cyclone                              |
| vfx      | Soft Smoke, Steam Plume, Fire Plume, Wispy Smoke |
| rotation | Spinning Coins                                   |

## Shared adaptations

- Pylinka samples independent X/Y velocities. Point emitters use angular and speed spread; boxes use vertical speed spread, omitting lateral drift; disk emitters use radial velocity or a narrow cone for upward flames. These distributions differ from the source.
- Easing curves are represented by sampled Hermite points. Color channels are authored as absolute values against white initial color. Ease Pop uses a larger sprite to make its overshooting size curve visible.
- Vortex recipes combine our vortex and inward radial modifiers. Pylinka uses linear distance falloff; ours uses constant strength inside a cutoff. Global source fields use a large finite cutoff. Drag uses our existing integration rather than Pylinka's exponential damping.
- Coin variants use seven emitters, one per color row, sharing the total spawn rate. This approximates random per-particle color selection; each row loops at 14 FPS. Gem Spin intentionally uses the same coin sheet as the source recipe.
- Fire Plume and Wispy Smoke use 64-frame atlases and once-forward playback over particle lifetime. Their playback therefore follows our existing lifetime-based animation instead of a fixed source FPS.
- Trail scenes move the ParticleEffect display object along a figure-eight or pendulum path before simulation. World-space particles stay behind. These paths approximate the gallery movement; source spline timing and distance-based extra births are not reproduced. Pause and Restart also control this demo movement. Trails do not prewarm at a stationary origin.
- Other effects prewarm for their maximum lifetime. Full-width fields resize their box to the canvas. The background is the same dark checkerboard for every effect.

## Artwork

Static VFX and flipbook textures are copied from Pylinka's Brackeys bundle; see [texture credits](textures/CREDITS.txt) for its CC0 attribution. The coin atlas is copied from Pylinka under the repository's included [MIT license](LICENSE); animation names were added to the atlas metadata. The existing soft blob retains its original license in `../particle-examples/DEFOLD-LICENSE.txt`. Only used textures are included.

## Deferred recipes

These 31 recipes need behavior we are not adding in this pass.

| Recipe            | Missing behavior                         |
| ----------------- | ---------------------------------------- |
| Arcane Burst      | instantaneous bursts                     |
| Confetti Pop      | instantaneous bursts                     |
| Success Sparkle   | instantaneous bursts                     |
| Ink Bloom         | instantaneous bursts                     |
| Spell Cast        | instantaneous bursts                     |
| Enchant Ring      | instantaneous bursts                     |
| Notification Ping | instantaneous bursts                     |
| Heart Pop         | instantaneous bursts                     |
| Energy Burst      | instantaneous bursts                     |
| Jackpot Burst     | instantaneous bursts                     |
| Firework          | death-triggered subemitters              |
| Exploding Ships   | death-triggered subemitters              |
| Coin Pop          | death-triggered subemitters              |
| Ember Smoke       | death-triggered subemitters              |
| Galaxy            | turbulence                               |
| Ember Vortex      | turbulence                               |
| Turbulent Motes   | turbulence                               |
| Heart Glow        | emission masks                           |
| Star Stamp        | emission masks                           |
| Bolt Strike       | emission masks                           |
| WIN Sign          | emission masks                           |
| Halo Ring         | emission masks                           |
| Fountain Basin    | collisions / obstacle fields             |
| Snow Globe        | turbulence, collisions / obstacle fields |
| Hail on Crate     | collisions / obstacle fields             |
| Spark Anvil       | collisions / obstacle fields             |
| Stream Past Stone | collisions / obstacle fields             |
| Magnet Void       | collisions / obstacle fields             |
| Spark Burst       | instantaneous bursts                     |
| Tumbling Shards   | instantaneous bursts                     |
| Cloud Puff        | instantaneous bursts                     |
