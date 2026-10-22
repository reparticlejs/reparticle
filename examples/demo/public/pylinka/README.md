# Pylinka examples

Effects adapted from [Pylinka recipes](https://github.com/schmooky/pylinka/blob/d736f8651db9dbd221f34e3eabf4ce88e7d320fe/apps/site/src/recipes/data.ts), under the included MIT license.

Compact effects use emitter scale 4 for visibility. Wide fields use scale 1 with larger sprites to keep their authored footprint visible. Large flipbooks use 2× sprite sizing. Full-width falling effects start at the top; rising fields start at the bottom.

Only existing Reparticle features are used. Effects requiring turbulence, collisions, emission masks, or subemitters are deferred.

## Ember Rise

A wide bed of small orange embers rising and fading. Preserves the 140 × 20 box, 110 particles/second, 1.2–2.2 second lifetime, 40–95 units/second upward birth speed, upward acceleration of 25 units/s², drag 0.5, and additive blend. Sine-out size and color transitions are approximated with five Hermite curve points. Prewarms for 2.2 seconds.

Our box emits straight upward, so the source's small independent sideways velocity (±6 units/second) is omitted. Uses the existing soft particle blob.

## Supported collection

26 of the 90 source recipes are currently included; the gallery has been curated down from the original port collection. These are visual adaptations using existing engine APIs, not pixel-identical ports. All effect JSON remains separate from Pixi artwork and playback bindings. Arcane Burst demonstrates scheduled bursts; the other adaptations use the existing engine APIs.

| Group    | Included effects                                                               |
| -------- | ------------------------------------------------------------------------------ |
| abstract | Ease Pop, Nebula, Data Stream                                                  |
| trails   | Coin Spark Trail, Infinity Loop                                                |
| fire     | Ember Rise                                                                     |
| magic    | Star Sparkle, Stardust Fall, Gem Spin, Arcane Burst                            |
| ambient  | Rain, Fireflies                                                                |
| ui       | Coin Shower, Coin Fountain                                                     |
| swirl    | Whirlpool, Black Hole, Cyclone, Helix Climb                                    |
| vfx      | Shooting Stars, Twirl Trails, Soft Smoke, Steam Plume, Fire Plume, Wispy Smoke |
| rotation | Spinning Coins, Quarter-Turn Drop                                              |

## Shared adaptations

- Pylinka samples independent X/Y velocities. Point emitters use angular and speed spread; boxes use vertical speed spread, omitting lateral drift; disk emitters use radial velocity or a narrow cone for upward flames. Shooting Stars rotates its box for diagonal travel. These distributions differ from the source.
- Easing curves are represented by sampled Hermite points. Color channels are authored as absolute values against white initial color. Ease Pop uses a larger sprite to make its overshooting size curve visible.
- Vortex recipes combine our vortex and inward radial modifiers. Pylinka uses linear distance falloff; ours uses constant strength inside a cutoff. Global source fields use a large finite cutoff. Drag uses our existing integration rather than Pylinka's exponential damping.
- Coin variants use seven emitters, one per color row, sharing the total spawn rate. This approximates random per-particle color selection; each row loops at 14 FPS. Gem Spin intentionally uses the same coin sheet as the source recipe.
- Fire Plume and Wispy Smoke use 64-frame atlases and once-forward playback over particle lifetime. Their playback therefore follows our existing lifetime-based animation instead of a fixed source FPS.
- Trail scenes move the ParticleEffect display object along a figure-eight or pendulum path before simulation. World-space particles stay behind. These paths approximate the gallery movement; source spline timing and distance-based extra births are not reproduced. Pause and Restart also control this demo movement. Trails do not prewarm at a stationary origin.
- Other effects except Arcane Burst prewarm for their maximum lifetime. Full-width fields resize their box to the canvas. The background is the same dark checkerboard for every effect.

## Artwork

Static VFX and flipbook textures are copied from Pylinka's Brackeys bundle; see [texture credits](textures/CREDITS.txt) for its CC0 attribution. The coin atlas is copied from Pylinka under the repository's included [MIT license](LICENSE); animation names were added to the atlas metadata. The existing soft blob retains its original license in `../particle-examples/DEFOLD-LICENSE.txt`. Only used textures are included.

## Deferred recipes

These 30 recipes remain deferred. Burst-only recipes can now be ported using scheduled bursts.

| Recipe            | Status / missing behavior                |
| ----------------- | ---------------------------------------- |
| Confetti Pop      | ready to port with scheduled bursts      |
| Success Sparkle   | ready to port with scheduled bursts      |
| Ink Bloom         | ready to port with scheduled bursts      |
| Spell Cast        | ready to port with scheduled bursts      |
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
| Spark Burst       | ready to port with scheduled bursts      |
| Tumbling Shards   | ready to port with scheduled bursts      |
| Cloud Puff        | ready to port with scheduled bursts      |

### Arcane Burst

260 violet particles appear together at time zero every 1.3 seconds, with no
continuous emission. Lifetime is 0.6–1.1 seconds, drag is 2.3, and cubic ease-out
curves fade and shrink the particles. The source's independent X/Y velocity
ranges are approximated by radial direction and speed spread. Display scale is
4, matching the other compact adaptations. No prewarm: Restart shows a fresh burst.
