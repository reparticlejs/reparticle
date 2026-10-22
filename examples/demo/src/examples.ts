import type { Example } from './types/example';

export const examples: readonly Example[] = [
  {
    id: 'energy',
    name: 'Energy',
    file: 'particle-examples/energy.json',
    artwork: { energy: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'exp1',
    name: 'Explosion',
    file: 'particle-examples/exp1.json',
    artwork: {
      emitter2: { source: 'particle-examples/circle-05.png' },
      d: { source: 'particle-examples/circle-05.png' },
      emitter: { source: 'particle-examples/circle-05.png' },
      emitter3: { source: 'particle-examples/scorch-01.png' },
    },
  },
  {
    id: 'exp2',
    name: 'Celebration cracker',
    file: 'particle-examples/exp2.json',
    artwork: { emitter4: { source: 'particle-examples/ta.png' } },
  },
  {
    id: 'fire',
    name: 'Candle flame',
    file: 'particle-examples/fire.json',
    artwork: { fire: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'loading',
    name: 'Loading',
    file: 'particle-examples/loading.json',
    artwork: { loading: { source: 'particle-examples/circle-05-up.png' } },
  },
  {
    id: 'smoke',
    name: 'Smoke',
    file: 'particle-examples/smoke.json',
    artwork: { smoke: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'fog',
    name: 'Fog',
    file: 'particle-examples/fog.json',
    artwork: { fog: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'confetti',
    name: 'Confetti',
    file: 'particle-examples/confetti.json',
    verticalPosition: 0,
    fullWidth: true,
    artwork: { emitter: { source: 'particle-examples/ta.png' } },
  },
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
    artwork: {
      'coin-shower-gold': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_gold',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-shower-ruby': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_ruby',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-shower-emerald': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_emerald',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-shower-sapphire': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_sapphire',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-shower-amethyst': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_amethyst',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-shower-rose': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_rose',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-shower-silver': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_silver',
        playback: 'loop-forward',
        fps: 14,
      },
    },
    verticalPosition: 0,
    fullWidth: true,
  },
  {
    id: 'pylinka-coin-fountain',
    name: 'Coin Fountain',
    file: 'pylinka/coin-fountain.json',
    artwork: {
      'coin-fountain-gold': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_gold',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-fountain-ruby': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_ruby',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-fountain-emerald': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_emerald',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-fountain-sapphire': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_sapphire',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-fountain-amethyst': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_amethyst',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-fountain-rose': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_rose',
        playback: 'loop-forward',
        fps: 14,
      },
      'coin-fountain-silver': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_silver',
        playback: 'loop-forward',
        fps: 14,
      },
    },
  },
  {
    id: 'pylinka-gem-spin',
    name: 'Gem Spin',
    file: 'pylinka/gem-spin.json',
    artwork: {
      'gem-spin-gold': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_gold',
        playback: 'loop-forward',
        fps: 14,
      },
      'gem-spin-ruby': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_ruby',
        playback: 'loop-forward',
        fps: 14,
      },
      'gem-spin-emerald': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_emerald',
        playback: 'loop-forward',
        fps: 14,
      },
      'gem-spin-sapphire': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_sapphire',
        playback: 'loop-forward',
        fps: 14,
      },
      'gem-spin-amethyst': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_amethyst',
        playback: 'loop-forward',
        fps: 14,
      },
      'gem-spin-rose': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_rose',
        playback: 'loop-forward',
        fps: 14,
      },
      'gem-spin-silver': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_silver',
        playback: 'loop-forward',
        fps: 14,
      },
    },
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
    artwork: {
      'spinning-coins-gold': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_gold',
        playback: 'loop-forward',
        fps: 14,
      },
      'spinning-coins-ruby': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_ruby',
        playback: 'loop-forward',
        fps: 14,
      },
      'spinning-coins-emerald': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_emerald',
        playback: 'loop-forward',
        fps: 14,
      },
      'spinning-coins-sapphire': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_sapphire',
        playback: 'loop-forward',
        fps: 14,
      },
      'spinning-coins-amethyst': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_amethyst',
        playback: 'loop-forward',
        fps: 14,
      },
      'spinning-coins-rose': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_rose',
        playback: 'loop-forward',
        fps: 14,
      },
      'spinning-coins-silver': {
        source: 'pylinka/textures/coins.json',
        animation: 'coin_silver',
        playback: 'loop-forward',
        fps: 14,
      },
    },
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
  {
    id: 'water-stream',
    name: 'Water stream',
    file: 'water-stream/effect.json',
    artwork: {
      stream: { source: 'water-stream/droplet.svg' },
      highlights: { source: 'water-stream/droplet.svg' },
      spray: { source: 'water-stream/droplet.svg' },
    },
  },
  {
    id: 'falling-leaves',
    name: 'Falling leaves',
    file: 'falling-leaves/effect.json',
    verticalPosition: 0,
    fullWidth: true,
    artwork: {
      amber: { source: 'falling-leaves/leaf.svg' },
      rust: { source: 'falling-leaves/leaf.svg' },
      gold: { source: 'falling-leaves/leaf.svg' },
    },
  },
  {
    id: 'fireball',
    name: 'Fireball',
    file: 'fireball/effect.json',
    motion: 'pendulum',
    artwork: {
      smoke: { source: 'pylinka/textures/smoke_01_a.png' },
      flame: { source: 'particle-examples/particle-blob.png' },
      core: { source: 'particle-examples/particle-blob.png' },
      sparks: { source: 'particle-examples/particle-blob.png' },
    },
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    file: 'fireworks/effect.json',
    artwork: {
      gold: { source: 'particle-examples/particle-blob.png' },
      'gold-flash': { source: 'particle-examples/particle-blob.png' },
      rose: { source: 'particle-examples/particle-blob.png' },
      'rose-flash': { source: 'particle-examples/particle-blob.png' },
      blue: { source: 'particle-examples/particle-blob.png' },
      'blue-flash': { source: 'particle-examples/particle-blob.png' },
    },
  },
  {
    id: 'portal',
    name: 'Portal',
    file: 'portal/effect.json',
    artwork: {
      halo: { source: 'particle-examples/particle-blob.png' },
      sparks: { source: 'particle-examples/particle-blob.png' },
      filaments: { source: 'particle-examples/particle-blob.png' },
    },
  },
  {
    id: 'drops',
    name: 'Drops',
    file: 'drops/effect.json',
    artwork: {
      droplets: { source: 'drops/droplet.svg' },
      'fine-drops': { source: 'drops/droplet.svg' },
    },
  },
  {
    id: 'tornado',
    name: 'Tornado',
    file: 'tornado/effect.json',
    artwork: {
      base: { source: 'pylinka/textures/smoke_01_a.png' },
      middle: { source: 'pylinka/textures/smoke_01_a.png' },
      crown: { source: 'pylinka/textures/smoke_01_a.png' },
      debris: { source: 'falling-leaves/leaf.svg' },
    },
  },
  {
    id: 'flies',
    name: 'Flies',
    file: 'flies/effect.json',
    artwork: {
      left: { source: 'flies/fly.svg' },
      right: { source: 'flies/fly.svg' },
      center: { source: 'flies/fly.svg' },
    },
  },
  {
    id: 'campfire',
    name: 'Campfire',
    file: 'campfire/effect.json',
    artwork: {
      smoke: { source: 'pylinka/textures/smoke_01_a.png' },
      flames: { source: 'pylinka/textures/smoke_01_a.png' },
      core: { source: 'particle-examples/particle-blob.png' },
      embers: { source: 'particle-examples/particle-blob.png' },
    },
  },
  {
    id: 'stress-test',
    name: 'Stress test · 1M',
    file: 'stress-test/effect.json',
    artwork: {
      'particles-a': { source: 'stress-test/particle.svg' },
      'particles-b': { source: 'stress-test/particle.svg' },
    },
  },
];
