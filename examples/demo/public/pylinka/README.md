# Pylinka examples

Effects adapted from [Pylinka recipes](https://github.com/schmooky/pylinka/blob/d736f8651db9dbd221f34e3eabf4ce88e7d320fe/apps/site/src/recipes/data.ts), under the included MIT license.

Compact effects use emitter scale 4 for visibility. Wide fields use scale 1 with larger sprites to keep their authored footprint visible. Large flipbooks use 2× sprite sizing. Full-width falling effects start at the top; rising fields start at the bottom.

Only existing Reparticle features are used. Effects requiring turbulence, collisions, emission masks, or subemitters are deferred.

## Ember Rise

A wide bed of small orange embers rising and fading. Preserves the 140 × 20 box, 110 particles/second, 1.2–2.2 second lifetime, 40–95 units/second upward birth speed, upward acceleration of 25 units/s², drag 0.5, and additive blend. Sine-out size and color transitions are approximated with five Hermite curve points. Prewarms for 2.2 seconds.

Our box emits straight upward, so the source's small independent sideways velocity (±6 units/second) is omitted. Uses the existing soft particle blob.

## Supported collection

33 of the 90 source recipes are currently included; the gallery has been curated down from the original port collection. These are visual adaptations using existing engine APIs, not pixel-identical ports. All effect JSON remains separate from Pixi artwork and playback bindings. Arcane Burst demonstrates scheduled bursts; the other adaptations use the existing engine APIs.

| Group    | Included effects                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------- |
| abstract | Ease Pop, Nebula, Data Stream, Ink Bloom                                                                |
| trails   | Coin Spark Trail, Infinity Loop                                                                         |
| fire     | Ember Rise                                                                                              |
| magic    | Star Sparkle, Stardust Fall, Gem Spin, Arcane Burst, Spell Cast                                         |
| ambient  | Rain, Fireflies                                                                                         |
| ui       | Coin Shower, Coin Fountain, Confetti Pop, Success Sparkle                                               |
| swirl    | Whirlpool, Black Hole, Cyclone, Helix Climb                                                             |
| vfx      | Shooting Stars, Twirl Trails, Soft Smoke, Steam Plume, Fire Plume, Wispy Smoke, Cloud Puff, Spark Burst |
| rotation | Spinning Coins, Quarter-Turn Drop, Tumbling Shards                                                      |

## Shared adaptations

- Pylinka samples independent X/Y velocities. Point emitters use angular and speed spread; boxes use vertical speed spread, omitting lateral drift; disk emitters use radial velocity or a narrow cone for upward flames. Shooting Stars rotates its box for diagonal travel. These distributions differ from the source.
- Easing curves are represented by sampled Hermite points. Color channels are authored as absolute values against white initial color. Ease Pop uses a larger sprite to make its overshooting size curve visible.
- Vortex recipes combine our vortex and inward radial modifiers. Pylinka uses linear distance falloff; ours uses constant strength inside a cutoff. Global source fields use a large finite cutoff. Drag uses our existing integration rather than Pylinka's exponential damping.
- Coin variants use seven emitters, one per color row, sharing the total spawn rate. This approximates random per-particle color selection; each row loops at 14 FPS. Gem Spin intentionally uses the same coin sheet as the source recipe.
- Fire Plume and Wispy Smoke use 64-frame atlases and once-forward playback over particle lifetime. Their playback therefore follows our existing lifetime-based animation instead of a fixed source FPS.
- Trail scenes move the ParticleEffect display object along a figure-eight or pendulum path before simulation. World-space particles stay behind. These paths approximate the gallery movement; source spline timing is not reproduced. Coin Spark Trail uses distance-only emission at 1.4 particles per world unit; the source combines that with 420 particles/second. Pause and Restart also control this demo movement. Trails do not prewarm at a stationary origin.
- Continuous effects prewarm for their maximum lifetime. Full-width fields resize their box to the canvas. The background is the same dark checkerboard for every effect.

## Artwork

Static VFX and flipbook textures are copied from Pylinka's Brackeys bundle; see [texture credits](textures/CREDITS.txt) for its CC0 attribution. The coin atlas is copied from Pylinka under the repository's included [MIT license](LICENSE); animation names were added to the atlas metadata. The existing soft blob retains its original license in `../particle-examples/DEFOLD-LICENSE.txt`. Only used textures are included.

## Deferred recipes

These 23 recipes remain deferred. Burst-only recipes can now be ported using scheduled bursts.

| Recipe            | Status / missing behavior                |
| ----------------- | ---------------------------------------- |
| Enchant Ring      | ready to port with scheduled bursts      |
| Notification Ping | ready to port with scheduled bursts      |
| Heart Pop         | ready to port with scheduled bursts      |
| Energy Burst      | ready to port with scheduled bursts      |
| Jackpot Burst     | ready to port with scheduled bursts      |
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

### Arcane Burst

220–300 violet particles appear together at time zero every 1.3 seconds, with no
continuous emission. Lifetime is 0.6–1.1 seconds, drag is 2.3, and cubic ease-out
curves fade and shrink the particles. The source's independent X/Y velocity
ranges are approximated by radial direction and speed spread. Display scale is
4, matching the other compact adaptations. Count spread of 40 is a Reparticle variation on the source’s fixed count of 260. No prewarm: Restart shows a fresh burst.

### Confetti Pop

A warm yellow-to-orange burst every 1.8 seconds, with 150–210 particles, lifetimes
of 1–1.8 seconds, and downward acceleration of 520 units/s². No prewarm. The source
uses a 30 × 10 rectangle with independent X/Y velocities; this adaptation uses a
point emitter with an upward angular fan. Original rectangular SVG artwork and
spin variation give the particles a paper-confetti appearance. Scale 2 keeps the
launch visible. Count spread of 30 is an added variation on the source's fixed 180.

### Success Sparkle, Spell Cast, and Cloud Puff

These scheduled bursts start immediately and repeat without prewarm. Success
Sparkle emits 130 green particles every 1.5 seconds from a diameter-16 circle,
with 0.5–1 second lifetimes and drag 2.6. Spell Cast emits 300 violet particles
every 1.2 seconds, with 0.6–1.1 second lifetimes and drag 2.4. Both use scale 4,
cubic ease-out fading/shrinking, and radial velocity as an approximation of the
source's independent X/Y velocity ranges. Counts remain fixed as authored.

Cloud Puff emits two animated clouds every 2.4 seconds, with 2.6–3.1 second
lifetimes. It uses the source CC0 64-frame cloud sheet, additive blending, linear
growth, and a sampled sine-in opacity fade. Sprites are twice the source size,
matching the other large flipbooks. The upward velocity fan approximates independent
X/Y sampling. Once-forward animation spans each particle's lifetime rather than
playing at the source's fixed 22 FPS. Its next burst overlaps the previous clouds.

### Spark Burst, Tumbling Shards, and Ink Bloom

All three use fixed-count scheduled bursts, scale 4, and no prewarm. Spark Burst
emits 110 cyan sparks every 1.4 seconds with the source spark_03 sprite, 0.7–1.3
second lifetimes, downward acceleration 200, and drag 0.7. Tumbling Shards emits
44 star_05 sprites every 1.2 seconds, with 1–1.6 second lifetimes, downward
acceleration 240, drag 0.35, random initial rotation, and ±540 degrees/s spin.
Its upward angular fan approximates the source's independent X/Y velocities.

Ink Bloom emits 220 blue particles every two seconds, with 1.5–2.5 second
lifetimes, drag 3, normal blending, and sine-out growth from scale 1 to 2.4.
Its blue tint darkens while opacity fades. Spark Burst and Ink Bloom approximate
independent X/Y birth velocities with radial direction and speed spread. Sine
curves are sampled as Hermite points; Spark Burst and Tumbling Shards use sine-in
color/opacity fading and linear size changes. Existing shared texture credits apply.
