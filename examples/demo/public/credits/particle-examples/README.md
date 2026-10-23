# ParticleExamples ports

Source: [yeqwep/ParticleExamples](https://github.com/yeqwep/ParticleExamples),
commit `e7a53af811d392a713831115388466580acfe388`. Effect definitions are CC0;
the original license is included as `LICENSE`.

Effects retained in the demo:

- [x] Energy (`energy`)
- [x] Explosion (`exp1`)
- [x] Celebration cracker (`exp2`, 2D adaptation)
- [x] Candle flame (`fire`)
- [x] Loading (`loading`)
- [x] Smoke (`smoke`)
- [x] Fog (`fog`)
- [x] Confetti (`confetti`)

## Energy

`energy.json` translates `assets/fx/energy.particlefx`, reusing the same blob
texture. It retains 128 slots, a circular emitter with diameter 150 ± 50,
spawn rate 50 ± 14, lifetime 0.8 ± 0.2 seconds, speed 20, size 60 ± 15,
RGB and stretch spread, initial-direction orientation, and additive blending.
The four alpha curve points retain their tangent slopes (`t_y / t_x`).

Modifiers remain in authored order: vortex (125 with spread 500, radius 500),
then inward radial acceleration (-400, radius 500). The omitted source duration
is explicitly zero, matching its continuous looping behavior. Seed 1 uses
Reparticle's deterministic random sequence. All effects share the dark checkerboard background.

## Explosion

`exp1.json` translates all four emitters in `assets/fx/exp1.particlefx`:

- `emitter2`: delayed rising smoke, normal blending, 24 slots.
- `d`: fast cone debris, velocity stretch, downward acceleration, 16 slots.
- `emitter`: short additive fire particles with outward acceleration, 24 slots.
- `emitter3`: one expanding additive flash using the scorch texture.

All emitters retain once playback, 0.5-second duration, original delays and
property curves/spreads. Single-point curves with nonzero tangents remain curves.
Negative color and alpha samples are preserved for the renderer's final clamp.
Source Y positions are reflected for canvas coordinates; source Z layers become
2D draw order (Z=0 before Z=1, preserving source order within each layer).
Seeds 1–4 use Reparticle's deterministic random sequence.

`circle-05.png` and `scorch-01.png` are unmodified copies of `circle_05_s.png` and
`scorch_01_s.png` from the source pack's `assets/img/particle` folder. The pack
credits [Kenney](https://kenney.nl/) for these CC0 assets. Textures remain in the
Pixi artwork settings, separate from simulation JSON. Use **Restart** to replay
the explosion after its particles finish; the demo does not add an automatic loop.

## Celebration cracker

`exp2.json` adapts `assets/fx/exp2.particlefx`. The source sphere emitter is
replaced with a 64-unit circle for this 2D implementation. This changes the
projected spawn distribution and projected speeds: it is not an exact 3D sphere
projection. All other authored particle properties and curves are retained.

The burst uses 64 slots, once playback for 0.1 seconds at 512 particles/second,
lifetime 2 ± 0.5 seconds, speed 800 ± 40, size 20, RGB spread, rotation spread,
and the original alpha, rotation, and stretch-Y curves. Default orientation is
retained, so the source's initial angular velocity is stored but not integrated.

Shared modifiers keep their source order: downward acceleration (-200), vortex
(30 ± 200, radius 1000, center reflected to Y=52), then drag (2.5). Acceleration
and nondirectional drag do not use their source position fields. Seed 1 uses
Reparticle's deterministic random sequence. **Restart** replays the burst.

`ta.png` is copied unchanged from the source pack's `assets/img/particle` folder,
covered by its CC0 license. Artwork stays in Pixi settings; the common dark checkerboard
background remains unchanged.

## Candle flame

`fire.json` translates `assets/fx/fire.particlefx`, using the original blob
texture and additive blending. It retains 24 slots, 8 births per second,
2-second lifetime, speed 80, size 80 ± 30, and the narrow cone's dimensions
(width 0.5 ± 0.25, height 1 ± 0.1). The source omits initial blue, which is zero
in Defold; the port sets it explicitly rather than taking Reparticle's default 1.

Size, red, green, and alpha curves retain all source values and tangent slopes.
Upward acceleration 150 runs before drag 3; the acceleration's authored position
has no effect on this uniform force. Playback loops with duration 1 second,
using Reparticle seed 1. The demo adds a 2-second start offset (one particle
lifetime) so the flame is fully developed on its first visible frame. The common
dark checkerboard background is unchanged.

## Loading

`loading.json` translates `assets/fx/loading.particlefx`: 12 slots, 4 births per
second, 2.5-second lifetime, size 100, additive blending, and looping playback
with duration 1 second. Omitted box dimensions and speed are explicitly zero,
so overlapping particles stay centered. Alpha and rotation curves retain their
source values and tangent slopes, including the near-360-degree rotation.

`circle-05-up.png` is an unmodified copy of `assets/img/particle/circle_05_up.png`
from the CC0 source pack. This single atlas image rotates and fades; it is not a
flipbook animation. The demo adds a 2.5-second start offset (one particle lifetime)
so the full spinner is visible immediately. Artwork stays in Pixi settings, with
the shared dark checkerboard background.

## Smoke

`smoke.json` translates `assets/fx/smoke.particlefx`, using the original blob
texture and screen blending. It retains 48 slots, 12 births/second, 4-second
lifetime, speed 60, size 70 ± 10, a 20×10 cone emitter, and the original initial
alpha/stretch spreads. Alpha and stretch curves preserve every point and slope.

All seven modifiers remain in authored order: upward acceleration 80, drag 3,
radial force 36 ± 36 within 500 units, then four localized vortices. Vortex
positions reflect source Y into canvas coordinates; strengths, spreads, and
radii remain unchanged. These opposing vortices produce the swaying motion.
Playback loops with duration 1 second and seed 1. The demo adds a 4-second start
offset (one particle lifetime) so the smoke is fully developed immediately, on
the shared dark checkerboard background.

## Fog

`fog.json` translates `assets/fx/fog.particlefx`, using the original blob texture
and screen blending. It retains a 600×400 box, 32 slots, 8 births/second,
10-second lifetime, size 400 ± 100, alpha 0.95 ± 0.5, and the original initial
stretch values/spreads. Omitted speed is explicitly zero; no modifiers are added.

All seven alpha points and both six-point stretch curves retain their authored
values and tangent slopes, including negative samples. Playback loops with
1-second duration and a 10-second start offset (one particle lifetime) so the fog
is already developed on its first visible frame. Capacity remains 32 even though rate × lifetime
is 80: living particles are retained and excess births are dropped. Seed 1 and
the shared dark checkerboard background follow the other examples.

## Confetti

`confetti.json` adapts `assets/fx/confetti.particlefx`: 128 slots, a 1280×10
box, 16 births/second, 5-second lifetime, size 20, zero initial speed, RGB spread,
and initial rotation/spread of 360 degrees. Playback loops with duration 3 seconds.
Default orientation is retained; the authored angular velocity is stored but not
integrated. Rotation instead follows the original rotation-over-lifetime curve.

The single alpha point retains its nonzero tangent, producing a linear fade-in;
it must not become a constant zero. The rotation and stretch-Y curves preserve
all values and slopes. Downward acceleration (-50 ± 10) precedes radial force
(5 ± 20, radius 1500), with its center reflected to canvas Y=-214.

The full-screen demo variant spawns at the top edge and updates box width to
match the canvas on resize. It increases downward acceleration to -75 and adds
40 units/second of initial downward speed (negative box speed). Lifetime is
extended to 10 seconds so particles reach the bottom of tall canvases; capacity
is raised to 256 to accommodate the longer fall. The original curves and color
spread remain unchanged. It reuses CC0 `ta.png`, normal blending, seed 1, and
the shared dark checkerboard background.

## Shared artwork

`particle-blob.png` is Defold's unmodified built-in 32×32 particle texture. Copyright 2020 The Defold Foundation; see `DEFOLD-LICENSE.txt`. The other retained textures come from the source pack, under its included `LICENSE`. Artwork stays in Pixi bindings, separate from effect JSON.
