# Shared reparticle examples

The site and standalone demo share this catalog, effect JSON, artwork, and licenses.
Definitions live in `public/effects`, artwork in `public/assets`, and the ordered
catalog in `src/catalog`. Both apps serve this public directory.

The private `@reparticle/examples` package exports the catalog. Its player types come
from `@reparticle/player`; it contains no application shell or playback runtime.

## Credits

These examples are adaptations using Reparticle's existing features, not
pixel-identical reproductions of the source effects.

- [ParticleExamples](https://github.com/yeqwep/ParticleExamples/tree/e7a53af811d392a713831115388466580acfe388)
  inspired Energy, Explosion, Celebration cracker, Candle flame, Loading, Smoke,
  Fog, and Confetti. Its effect definitions and shared artwork are covered by
  [CC0 1.0](licenses/CC0-1.0.txt). The source pack credits
  [Kenney](https://kenney.nl/) for its particle textures.
- [Pylinka recipes](https://github.com/schmooky/pylinka/blob/d736f8651db9dbd221f34e3eabf4ce88e7d320fe/apps/site/src/recipes/data.ts)
  inspired Ember Rise, Ease Pop, Star Sparkle, Rain, Stardust Fall, Nebula,
  Coin Shower, Coin Fountain, Black Hole, Cyclone, Spinning Coins, Soft Smoke,
  Steam Plume, Fire Plume, Wispy Smoke, Coin Spark Trail, and Infinity Loop.
  The recipes and coin atlas are covered by the included
  [MIT license](licenses/Pylinka-MIT.txt). Animation names were added to the coin
  atlas metadata.
- `public/assets/soft-particle.png` is Defold's unmodified built-in particle
  texture, copyright 2020 The Defold Foundation. Its
  [Defold license](licenses/Defold.txt) is included in full.
- Static VFX textures and flipbooks came through Pylinka's Brackeys VFX bundle,
  credited as CC0/public domain. The bundle credits
  [Picster](https://github.com/RPicster/Godot-particle-and-vfx-textures) and
  [Kenney](https://kenney.nl/assets/particle-pack) for particle textures,
  [Thomas Iché](https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks)
  for flipbooks, and [CodeManu](https://codemanu.itch.io/vfx-free-pack) for
  pre-drawn sheets. Brackeys repackaged and modified some assets; the source
  bundle describes downscaling and re-slicing sheets to exact grid multiples.

Full license texts are kept in `licenses/`, outside Vite's public asset directory.
