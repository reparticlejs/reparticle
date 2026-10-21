# ParticleExamples ports

Source: [yeqwep/ParticleExamples](https://github.com/yeqwep/ParticleExamples),
commit `e7a53af811d392a713831115388466580acfe388`. Effect definitions are CC0;
the original license is included as `LICENSE`.

Port each effect in the source README's order:

- [x] Dust (`dust`)
- [x] Energy (`energy`)
- [x] Explosion (`exp1`)
- [ ] Celebration cracker (`exp2`)
- [ ] Candle flame (`fire`)
- [ ] Loading (`loading`)
- [ ] Slash (`slash`)
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
