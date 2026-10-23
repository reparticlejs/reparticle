import type { Example } from '../types/example';

export const showcaseExamples: readonly Example[] = [
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
    id: 'metal-sparks',
    name: 'Metal sparks',
    file: 'metal-sparks/effect.json',
    artwork: {
      streaks: { source: 'particle-examples/particle-blob.png' },
      embers: { source: 'particle-examples/particle-blob.png' },
      contact: { source: 'particle-examples/particle-blob.png' },
    },
  },
  {
    id: 'magic-impact',
    name: 'Magic spell impact',
    file: 'magic-impact/effect.json',
    artwork: {
      smoke: { source: 'pylinka/textures/smoke_01_a.png' },
      ring: { source: 'magic-impact/ring.svg' },
      sparks: { source: 'particle-examples/particle-blob.png' },
      motes: { source: 'particle-examples/particle-blob.png' },
      flash: { source: 'particle-examples/particle-blob.png' },
    },
  },
  {
    id: 'magical-aura',
    name: 'Magical aura',
    file: 'magical-aura/effect.json',
    artwork: {
      glow: { source: 'particle-examples/particle-blob.png' },
      rings: { source: 'magic-impact/ring.svg' },
      orbit: { source: 'particle-examples/particle-blob.png' },
      motes: { source: 'particle-examples/particle-blob.png' },
    },
  },
  {
    id: 'debris-explosion',
    name: 'Debris explosion',
    file: 'debris-explosion/effect.json',
    artwork: {
      dust: { source: 'pylinka/textures/smoke_01_a.png' },
      flash: { source: 'particle-examples/particle-blob.png' },
      chunks: { source: 'debris-explosion/fragment.svg' },
      chips: { source: 'debris-explosion/fragment.svg' },
    },
  },
];
