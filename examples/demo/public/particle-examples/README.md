# ParticleExamples ports

Source: [yeqwep/ParticleExamples](https://github.com/yeqwep/ParticleExamples),
commit `e7a53af811d392a713831115388466580acfe388`. Effect definitions are CC0;
the original license is included as `LICENSE`.

Port each effect in the source README's order:

- [x] Dust (`dust`)
- [ ] Energy (`energy`)
- [ ] Explosion (`exp1`)
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
