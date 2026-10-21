# Pylinka examples

Effects adapted from [Pylinka recipes](https://github.com/schmooky/pylinka/blob/d736f8651db9dbd221f34e3eabf4ce88e7d320fe/apps/site/src/recipes/data.ts), under the included MIT license.

Compact effects use emitter scale 4 for visibility. Wide fields use scale 1 with larger sprites to keep their authored footprint visible. Large flipbooks use 2× sprite sizing. Full-width falling effects start at the top; rising fields start at the bottom.

Only existing Reparticle features are used. Effects requiring turbulence, collisions, emission masks, subemitters, or instantaneous bursts are deferred.

## Campfire

Preserves the 520 particles/second rate, 0.5–1.1 second lifetime, upward acceleration, additive blend, and cubic ease-out color, opacity, and size curves. Prewarms for 1.1 seconds.

This is a visual adaptation, not an exact simulation port: a narrow cone replaces the disk with independent X/Y birth velocities. Speed ranges from 70 to 130 units/second. The existing soft particle blob replaces Pylinka's procedural soft quad; its license remains in `../particle-examples/DEFOLD-LICENSE.txt`.

## Torch

Preserves point emission, 600 particles/second, 0.4–0.8 second lifetime, upward acceleration of 60 units/s², additive blend, and cubic ease-out size and color curves (warm white to orange). Prewarms for 0.8 seconds.

Independent X/Y birth velocities are approximated with speed 130 ± 40 units/second and a narrow angular spread, calibrated to ±8 units/second sideways at the central speed. Uses the same existing soft particle blob as Campfire.

## Ember Rise

A wide bed of small orange embers rising and fading. Preserves the 140 × 20 box, 110 particles/second, 1.2–2.2 second lifetime, 40–95 units/second upward birth speed, upward acceleration of 25 units/s², drag 0.5, and additive blend. Sine-out size and color transitions are approximated with five Hermite curve points. Prewarms for 2.2 seconds.

Our box emits straight upward, so the source's small independent sideways velocity (±6 units/second) is omitted. Uses the existing soft particle blob.

## Blue Flame

A hot cyan-white flame fading to blue. Preserves 560 particles/second, 0.4–0.9 second lifetime, upward acceleration of 70 units/s², additive blend, and cubic ease-out size, color, and opacity curves. Prewarms for 0.9 seconds.

Like Campfire, this adapts the disk with independent X/Y birth velocities to a narrow cone. Birth speed ranges from 100 to 180 units/second. Uses the existing soft particle blob.

## Inferno

A wider, denser blaze fading from gold to deep red. Preserves 800 particles/second, 0.6–1.2 second lifetime, upward acceleration of 50 units/s², additive blend, and cubic ease-out size, color, and opacity curves. Prewarms for 1.2 seconds.

Like Campfire, a cone replaces the disk with independent X/Y birth velocities. Birth speed ranges from 120 to 220 units/second. Uses the existing soft particle blob and emitter scale 4.

## Candle

A small, calm flame fading from warm white to orange. Listed as “Candle (Pylinka)” to distinguish it from the existing Candle flame example. Preserves point emission, 200 particles/second, 0.5–0.9 second lifetime, upward acceleration of 40 units/s², additive blend, and cubic ease-out size, color, and opacity curves. Prewarms for 0.9 seconds at emitter scale 4.

Independent X/Y birth velocities are approximated with speed 55 ± 15 units/second and a narrow angular spread, calibrated to ±3 units/second sideways at the central speed. Uses the existing soft particle blob.

## Will-o'-Wisp

A pale green marsh flame fading to emerald. Preserves 400 particles/second, 0.5–1 second lifetime, upward acceleration of 60 units/s², additive blend, and cubic ease-out size, color, and opacity curves. Prewarms for 1 second at emitter scale 4.

Like Campfire, a narrow cone replaces the disk with independent X/Y birth velocities. Birth speed ranges from 60 to 120 units/second. Uses the existing soft particle blob.

## Fairy Dust

Gold motes drifting outward and falling. Preserves point emission, 260 particles/second, 1–2 second lifetime, downward acceleration of 40 units/s², drag 0.6, additive blend, and cubic ease-out size. Sine-in-out color and opacity transitions are approximated with five Hermite curve points. Prewarms for 2 seconds at emitter scale 4.

The source independently samples X/Y velocity in ±30 units/second. Our adaptation samples a full-circle direction and speed from 0 to approximately 42.43 units/second, preserving the maximum speed but not the square velocity distribution. Uses the existing soft particle blob.

## Healing Glow

Soft green light rising from a rectangular area. Preserves the 60 × 20 box, 190 particles/second, 1–1.8 second lifetime, 50–110 units/second upward birth speed, upward acceleration of 40 units/s², screen blend, and cubic ease-out size. Sine-out color and opacity transitions are approximated with five Hermite curve points. Prewarms for 1.8 seconds at emitter scale 4.

Our box emits straight upward, so the source's independent sideways velocity (±12 units/second) is omitted. Uses the existing soft particle blob. Arcane Burst is deferred because it requires instantaneous bursts.

## Supported collection

59 of the 90 source recipes are included. These are visual adaptations using existing engine APIs, not pixel-identical ports. All effect JSON remains separate from Pixi artwork and playback bindings. No simulation or renderer features were added.

| Group    | Included effects                                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| abstract | Ease Pop, Plasma Drift, Nebula, Data Stream                                                                                                                                  |
| trails   | Coin Spark Trail, Comet Tail, Pixie Trail, Smoke Trail, Sparkler, Neon Swipe, Ghost Wisp, Infinity Loop, Pendulum Sparks                                                     |
| fire     | Campfire, Torch, Ember Rise, Blue Flame, Inferno, Candle, Will-o'-Wisp                                                                                                       |
| magic    | Fairy Dust, Healing Glow, Star Sparkle, Frost Shimmer, Stardust Fall, Gem Spin                                                                                               |
| ambient  | Snowfall, Rain, Fireflies, Ash Fall, Pollen Drift, Bubbles, Embers Drift                                                                                                     |
| ui       | Gold Shower, XP Orbs, Coin Shower, Coin Fountain                                                                                                                             |
| combo    | Twin Flame, Comet & Smoke                                                                                                                                                    |
| swirl    | Whirlpool, Black Hole, Cyclone, Helix Climb                                                                                                                                  |
| vfx      | Rune Swirl, Fae Dust, Star Fall, Twinkle Field, Shooting Stars, Soft Stars, Flame Embers, Glow Orbs, Twirl Trails, Soft Smoke, Steam Plume, Fire Plume, Bonfire, Wispy Smoke |
| rotation | Spinning Coins, Quarter-Turn Drop                                                                                                                                            |

## Shared adaptations

- Pylinka samples independent X/Y velocities. Point emitters use angular and speed spread; boxes use vertical speed spread, omitting lateral drift; disk emitters use radial velocity or a narrow cone for upward flames. Shooting Stars rotates its box for diagonal travel. These distributions differ from the source.
- Easing curves are represented by sampled Hermite points. Color channels are authored as absolute values against white initial color. Ease Pop uses a larger sprite to make its overshooting size curve visible.
- Vortex recipes combine our vortex and inward radial modifiers. Pylinka uses linear distance falloff; ours uses constant strength inside a cutoff. Global source fields use a large finite cutoff. Drag uses our existing integration rather than Pylinka's exponential damping.
- Coin variants use seven emitters, one per color row, sharing the total spawn rate. This approximates random per-particle color selection; each row loops at 14 FPS. Gem Spin intentionally uses the same coin sheet as the source recipe.
- Fire Plume, Bonfire, and Wispy Smoke use 64-frame atlases and once-forward playback over particle lifetime. Their playback therefore follows our existing lifetime-based animation instead of a fixed source FPS.
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
