import type { Example } from './types/example';

export const examples: readonly Example[] = [
  {
    id: 'fountain',
    name: 'Star fountain',
    file: 'effect.json',
    artwork: { sparks: { source: 'textures/particles.json', frame: 'star' } },
  },
  {
    id: 'multiple',
    name: 'Multi-emitter',
    file: 'multiple-emitters.json',
    artwork: { sparks: { source: 'textures/particles.json', frame: 'spark' } },
  },
  {
    id: 'dust',
    name: 'Dust',
    file: 'particle-examples/dust.json',
    artwork: { dust: { source: 'particle-examples/particle-blob.png' } },
  },
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
    id: 'slash',
    name: 'Slash',
    file: 'particle-examples/slash.json',
    artwork: { slash: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'slash_knife',
    name: 'Knife slash',
    file: 'particle-examples/slash-knife.json',
    artwork: { slash_knife: { source: 'particle-examples/circle-05-up.png' } },
  },
  {
    id: 'smoke',
    name: 'Smoke',
    file: 'particle-examples/smoke.json',
    artwork: { smoke: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'twirl',
    name: 'Twirl',
    file: 'particle-examples/twirl.json',
    artwork: { emitter1: { source: 'particle-examples/twirl-01.png' } },
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
    id: 'pylinka-campfire',
    name: 'Campfire',
    file: 'pylinka/campfire.json',
    artwork: { campfire: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-torch',
    name: 'Torch',
    file: 'pylinka/torch.json',
    artwork: { torch: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-ember-rise',
    name: 'Ember Rise',
    file: 'pylinka/ember-rise.json',
    artwork: { 'ember-rise': { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-blue-flame',
    name: 'Blue Flame',
    file: 'pylinka/blue-flame.json',
    artwork: { 'blue-flame': { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-inferno',
    name: 'Inferno',
    file: 'pylinka/inferno.json',
    artwork: { inferno: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-candle',
    name: 'Candle (Pylinka)',
    file: 'pylinka/candle.json',
    artwork: { candle: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-will-o-wisp',
    name: "Will-o'-Wisp",
    file: 'pylinka/will-o-wisp.json',
    artwork: { 'will-o-wisp': { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-fairy-dust',
    name: 'Fairy Dust',
    file: 'pylinka/fairy-dust.json',
    artwork: { 'fairy-dust': { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'pylinka-healing-glow',
    name: 'Healing Glow',
    file: 'pylinka/healing-glow.json',
    artwork: { 'healing-glow': { source: 'particle-examples/particle-blob.png' } },
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
    id: 'pylinka-snowfall',
    name: 'Snowfall',
    file: 'pylinka/snowfall.json',
    artwork: {
      snowfall: {
        source: 'particle-examples/particle-blob.png',
      },
    },
    verticalPosition: 0,
    fullWidth: true,
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
    id: 'pylinka-gold-coins',
    name: 'Gold Shower',
    file: 'pylinka/gold-coins.json',
    artwork: {
      'gold-coins': {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-plasma-drift',
    name: 'Plasma Drift',
    file: 'pylinka/plasma-drift.json',
    artwork: {
      'plasma-drift': {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-frost-shimmer',
    name: 'Frost Shimmer',
    file: 'pylinka/frost-shimmer.json',
    artwork: {
      'frost-shimmer': {
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
    id: 'pylinka-ash-fall',
    name: 'Ash Fall',
    file: 'pylinka/ash-fall.json',
    artwork: {
      'ash-fall': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    verticalPosition: 0,
    fullWidth: true,
  },
  {
    id: 'pylinka-pollen-drift',
    name: 'Pollen Drift',
    file: 'pylinka/pollen-drift.json',
    artwork: {
      'pollen-drift': {
        source: 'particle-examples/particle-blob.png',
      },
    },
  },
  {
    id: 'pylinka-bubbles',
    name: 'Bubbles',
    file: 'pylinka/bubbles.json',
    artwork: {
      bubbles: {
        source: 'particle-examples/particle-blob.png',
      },
    },
    verticalPosition: 1,
    fullWidth: true,
  },
  {
    id: 'pylinka-embers-drift',
    name: 'Embers Drift',
    file: 'pylinka/embers-drift.json',
    artwork: {
      'embers-drift': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    verticalPosition: 1,
    fullWidth: true,
  },
  {
    id: 'pylinka-xp-orbs',
    name: 'XP Orbs',
    file: 'pylinka/xp-orbs.json',
    artwork: {
      'xp-orbs': {
        source: 'particle-examples/particle-blob.png',
      },
    },
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
    id: 'pylinka-twin-flame',
    name: 'Twin Flame',
    file: 'pylinka/twin-flame.json',
    artwork: {
      outer: {
        source: 'particle-examples/particle-blob.png',
      },
      core: {
        source: 'particle-examples/particle-blob.png',
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
    id: 'pylinka-rune-swirl',
    name: 'Rune Swirl',
    file: 'pylinka/rune-swirl.json',
    artwork: {
      'rune-swirl': {
        source: 'pylinka/textures/magic_03.png',
      },
    },
  },
  {
    id: 'pylinka-fae-dust',
    name: 'Fae Dust',
    file: 'pylinka/fae-dust.json',
    artwork: {
      'fae-dust': {
        source: 'pylinka/textures/magic_05.png',
      },
    },
  },
  {
    id: 'pylinka-star-fall',
    name: 'Star Fall',
    file: 'pylinka/star-fall.json',
    artwork: {
      'star-fall': {
        source: 'pylinka/textures/star_01.png',
      },
    },
    verticalPosition: 0,
    fullWidth: true,
  },
  {
    id: 'pylinka-twinkle-field',
    name: 'Twinkle Field',
    file: 'pylinka/twinkle-field.json',
    artwork: {
      'twinkle-field': {
        source: 'pylinka/textures/star_03.png',
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
    id: 'pylinka-soft-stars',
    name: 'Soft Stars',
    file: 'pylinka/soft-stars.json',
    artwork: {
      'soft-stars': {
        source: 'pylinka/textures/star_01_a.png',
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
    id: 'pylinka-flame-embers',
    name: 'Flame Embers',
    file: 'pylinka/flame-embers.json',
    artwork: {
      'flame-embers': {
        source: 'pylinka/textures/flame_02.png',
      },
    },
  },
  {
    id: 'pylinka-glow-orbs',
    name: 'Glow Orbs',
    file: 'pylinka/glow-orbs.json',
    artwork: {
      'glow-orbs': {
        source: 'pylinka/textures/circle_02.png',
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
    id: 'pylinka-bonfire',
    name: 'Bonfire',
    file: 'pylinka/bonfire.json',
    artwork: {
      bonfire: {
        source: 'pylinka/textures/fire_03_8x8.json',
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
    id: 'pylinka-comet-tail',
    name: 'Comet Tail',
    file: 'pylinka/comet-tail.json',
    artwork: {
      'comet-tail': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'figure-eight',
  },
  {
    id: 'pylinka-pixie-trail',
    name: 'Pixie Trail',
    file: 'pylinka/pixie-trail.json',
    artwork: {
      'pixie-trail': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'figure-eight',
  },
  {
    id: 'pylinka-smoke-trail',
    name: 'Smoke Trail',
    file: 'pylinka/smoke-trail.json',
    artwork: {
      'smoke-trail': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'figure-eight',
  },
  {
    id: 'pylinka-sparkler',
    name: 'Sparkler',
    file: 'pylinka/sparkler.json',
    artwork: {
      sparkler: {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'figure-eight',
  },
  {
    id: 'pylinka-neon-swipe',
    name: 'Neon Swipe',
    file: 'pylinka/neon-swipe.json',
    artwork: {
      'neon-swipe': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'figure-eight',
  },
  {
    id: 'pylinka-ghost-wisp',
    name: 'Ghost Wisp',
    file: 'pylinka/ghost-wisp.json',
    artwork: {
      'ghost-wisp': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'figure-eight',
  },
  {
    id: 'pylinka-comet-and-smoke',
    name: 'Comet & Smoke',
    file: 'pylinka/comet-and-smoke.json',
    artwork: {
      core: {
        source: 'particle-examples/particle-blob.png',
      },
      smoke: {
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
    id: 'pylinka-pendulum-sparks',
    name: 'Pendulum Sparks',
    file: 'pylinka/pendulum-sparks.json',
    artwork: {
      'pendulum-sparks': {
        source: 'particle-examples/particle-blob.png',
      },
    },
    motion: 'pendulum',
  },
];
