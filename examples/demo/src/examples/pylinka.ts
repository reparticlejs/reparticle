import type { Example } from '../types/example';
import { createCoinArtwork } from './coin-artwork';

export const pylinkaExamples: readonly Example[] = [
  {
    id: 'pylinka-ember-rise',
    name: 'Ember Rise',
    file: 'pylinka/ember-rise.json',
    artwork: { 'ember-rise': { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-ease-pop',
    name: 'Ease Pop',
    file: 'pylinka/ease-pop.json',
    artwork: {
      'ease-pop': {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-star-sparkle',
    name: 'Star Sparkle',
    file: 'pylinka/star-sparkle.json',
    artwork: {
      'star-sparkle': {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-rain',
    name: 'Rain',
    file: 'pylinka/rain.json',
    artwork: {
      rain: {
        source: 'particle-examples/particle-blob.png',
      },
    },
    verticalPosition: 0,
    fullWidth: true,
  },
  {
    id: 'pylinka-fireflies',
    name: 'Fireflies',
    file: 'pylinka/fireflies.json',
    artwork: {
      fireflies: {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-stardust-fall',
    name: 'Stardust Fall',
    file: 'pylinka/stardust-fall.json',
    artwork: {
      'stardust-fall': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    verticalPosition: 0,
    fullWidth: true,
  },
  {
    id: 'pylinka-nebula',
    name: 'Nebula',
    file: 'pylinka/nebula.json',
    artwork: {
      nebula: {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-data-stream',
    name: 'Data Stream',
    file: 'pylinka/data-stream.json',
    artwork: {
      'data-stream': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    verticalPosition: 0,
    fullWidth: true,
  },
  {
    id: 'pylinka-coin-shower',
    name: 'Coin Shower',
    file: 'pylinka/coin-shower.json',
    artwork: createCoinArtwork('coin-shower'),
    verticalPosition: 0,
    fullWidth: true,
  },
  {
    id: 'pylinka-coin-fountain',
    name: 'Coin Fountain',
    file: 'pylinka/coin-fountain.json',
    artwork: createCoinArtwork('coin-fountain'),
  },
  {
    id: 'pylinka-gem-spin',
    name: 'Gem Spin',
    file: 'pylinka/gem-spin.json',
    artwork: createCoinArtwork('gem-spin'),
  },
  {
    id: 'pylinka-whirlpool',
    name: 'Whirlpool',
    file: 'pylinka/whirlpool.json',
    artwork: {
      whirlpool: {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-black-hole',
    name: 'Black Hole',
    file: 'pylinka/black-hole.json',
    artwork: {
      'black-hole': {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-cyclone',
    name: 'Cyclone',
    file: 'pylinka/cyclone.json',
    artwork: {
      cyclone: {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-helix-climb',
    name: 'Helix Climb',
    file: 'pylinka/helix-climb.json',
    artwork: {
      'helix-climb': {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-shooting-stars',
    name: 'Shooting Stars',
    file: 'pylinka/shooting-stars.json',
    artwork: {
      'shooting-stars': {
        source: 'pylinka/textures/star_05.png',
      },
    },
  },
  {
    id: 'pylinka-spinning-coins',
    name: 'Spinning Coins',
    file: 'pylinka/spinning-coins.json',
    artwork: createCoinArtwork('spinning-coins'),
    verticalPosition: 0,
    fullWidth: true,
  },
  {
    id: 'pylinka-quarter-turn-drop',
    name: 'Quarter-Turn Drop',
    file: 'pylinka/quarter-turn-drop.json',
    artwork: {
      'quarter-turn-drop': {
        source: 'pylinka/textures/star_01.png',
      },
    },
  },
  {
    id: 'pylinka-twirl-trails',
    name: 'Twirl Trails',
    file: 'pylinka/twirl-trails.json',
    artwork: {
      'twirl-trails': {
        source: 'pylinka/textures/twirl_01.png',
      },
    },
  },
  {
    id: 'pylinka-soft-smoke',
    name: 'Soft Smoke',
    file: 'pylinka/soft-smoke.json',
    artwork: {
      'soft-smoke': {
        source: 'pylinka/textures/smoke_01_a.png',
      },
    },
  },
  {
    id: 'pylinka-steam-plume',
    name: 'Steam Plume',
    file: 'pylinka/steam-plume.json',
    artwork: {
      'steam-plume': {
        source: 'pylinka/textures/smoke_05_a.png',
      },
    },
  },
  {
    id: 'pylinka-fire-plume-anim',
    name: 'Fire Plume',
    file: 'pylinka/fire-plume-anim.json',
    artwork: {
      'fire-plume-anim': {
        source: 'pylinka/textures/fire_01_8x8.json',
        animation: 'play',
        playback: 'once-forward',
      },
    },
  },
  {
    id: 'pylinka-wispy-smoke-anim',
    name: 'Wispy Smoke',
    file: 'pylinka/wispy-smoke-anim.json',
    artwork: {
      'wispy-smoke-anim': {
        source: 'pylinka/textures/wispy_smoke_01_8x8.json',
        animation: 'play',
        playback: 'once-forward',
      },
    },
  },
  {
    id: 'pylinka-coin-spark-trail',
    name: 'Coin Spark Trail',
    file: 'pylinka/coin-spark-trail.json',
    artwork: {
      'coin-spark-trail': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'figure-eight',
  },
  {
    id: 'pylinka-infinity-loop',
    name: 'Infinity Loop',
    file: 'pylinka/infinity-loop.json',
    artwork: {
      'infinity-loop': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'figure-eight',
  },
];
