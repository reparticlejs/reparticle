# ParticleExamples ports

Source: [yeqwep/ParticleExamples](https://github.com/yeqwep/ParticleExamples),
commit `e7a53af811d392a713831115388466580acfe388`. Effect definitions are CC0;
the original license is included as `LICENSE`.

Port each effect in the source README's order:

- [x] Dust (`dust`)
- [x] Energy (`energy`)
- [x] Explosion (`exp1`)
- [x] Celebration cracker (`exp2`, 2D adaptation)
- [x] Candle flame (`fire`)
- [x] Loading (`loading`)
- [x] Slash (`slash`)
- [ ] Knife slash (`slash_knife`)
- [ ] Smoke (`smoke`)
- [ ] Twirl (`twirl`)
- [ ] Fog (`fog`)
- [ ] Confetti (`confetti`)

## Dust

`dust.json` translates `assets/fx/dust.particlefx`. It retains the one-particle
capacity, one birth per second, 0.6-second lifetime, 250-unit speed, 100-unit
initial size, RGB spread, authored size/color/alpha curves, and drag magnitude 3.
Unspecified box dimensions remain zero. Tangent vectors become slopes `t_y / t_x`.
Defold's upward motion maps to Pixi's negative Y. Seed 1 makes this demo repeatable;
the random sequence is Reparticle's rather than Defold's.

The source's angular-velocity multiplier is 1, but initial angular velocity is
zero and orientation is default, so it adds no rotation. The demo uses a shared neutral gray background for all effects.

`particle-blob.png` is the unmodified 32×32 built-in texture used by the source,
from [Defold](https://github.com/defold/defold/blob/dev/engine/engine/content/builtins/graphics/particle_blob.png).
Copyright 2020 The Defold Foundation. Its separate license is included as
`DEFOLD-LICENSE.txt`; it is not part of ParticleExamples' CC0 artwork.

Artwork remains in Pixi's example settings, separate from effect JSON.

## Energy

`energy.json` translates `assets/fx/energy.particlefx`, reusing the same blob
texture. It retains 128 slots, a circular emitter with diameter 150 ± 50,
spawn rate 50 ± 14, lifetime 0.8 ± 0.2 seconds, speed 20, size 60 ± 15,
RGB and stretch spread, initial-direction orientation, and additive blending.
The four alpha curve points retain their tangent slopes (`t_y / t_x`).

Modifiers remain in authored order: vortex (125 with spread 500, radius 500),
then inward radial acceleration (-400, radius 500). The omitted source duration
is explicitly zero, matching its continuous looping behavior. Seed 1 uses
Reparticle's deterministic random sequence. All effects share the gray background.

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
covered by its CC0 license. Artwork stays in Pixi settings; the common gray
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
using Reparticle seed 1. The common gray background is unchanged.

## Loading

`loading.json` translates `assets/fx/loading.particlefx`: 12 slots, 4 births per
second, 2.5-second lifetime, size 100, additive blending, and looping playback
with duration 1 second. Omitted box dimensions and speed are explicitly zero,
so overlapping particles stay centered. Alpha and rotation curves retain their
source values and tangent slopes, including the near-360-degree rotation.

`circle-05-up.png` is an unmodified copy of `assets/img/particle/circle_05_up.png`
from the CC0 source pack. This single atlas image rotates and fades; it is not a
flipbook animation. Artwork stays in Pixi settings, with the shared gray background.

## Slash

`slash.json` translates `assets/fx/slash.particlefx`: one particle slot, once
playback for 1 second at 1 birth/second, 0.3-second lifetime, speed 1000, size 20,
and an 8×12 box emitter. Initial-direction orientation and additive blending
turn the original blob texture into the moving slash.

The emitter retains its offset (79, -119 in canvas coordinates). Its source
quaternion becomes a counterclockwise rotation of approximately 145 degrees.
Alpha and both stretch curves retain all values and tangent slopes, including
the steep stretch-Y tangents. Seed 1 uses Reparticle's random sequence.
**Restart** replays the once-only effect; the original emission rate is retained,
so the slash appears around one second after playback starts.
