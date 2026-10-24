import type { EffectInput } from '@reparticle/pixi';

export default {
  version: 1,
  emitters: [
    {
      capacity: 512,
      seed: 2,
      duration: 2,
      playMode: 'loop',
      emission: {
        rate: 120,
        shape: {
          type: 'circle',
          diameter: 24,
        },
      },
      initial: {
        lifetime: 2.5,
        size: 48,
        speed: 35,
        direction: -1.5707963267948966,
        spread: 0.3,
        red: 0.45,
        green: 0.48,
        blue: 0.52,
      },
      overLifetime: {
        alpha: {
          points: [
            {
              time: 0,
              value: 0.8,
              tangent: 0,
            },
            {
              time: 1,
              value: 0,
              tangent: 0,
            },
          ],
        },
        scale: {
          points: [
            {
              time: 0,
              value: 0.3,
              tangent: 1,
            },
            {
              time: 1,
              value: 1.5,
              tangent: 1,
            },
          ],
        },
      },
      id: 'smoke',
      startDelay: 0.3,
      modifiers: [],
      position: {
        x: 0,
        y: 0,
      },
      rendering: {
        blendMode: 'normal',
      },
    },
    {
      capacity: 512,
      seed: 1,
      duration: 2,
      playMode: 'loop',
      emission: {
        rate: 120,
        shape: {
          type: 'circle',
          diameter: 24,
        },
      },
      initial: {
        lifetime: 1.5,
        size: 30,
        speed: 90,
        direction: -1.5707963267948966,
        spread: 0.3,
        red: 1,
        green: 0.35,
        blue: 0.05,
      },
      overLifetime: {
        alpha: {
          points: [
            {
              time: 0,
              value: 0.8,
              tangent: 0,
            },
            {
              time: 1,
              value: 0,
              tangent: 0,
            },
          ],
        },
      },
      id: 'fire',
      modifiers: [],
      position: {
        x: -35,
        y: 0,
      },
      rendering: {
        blendMode: 'add',
      },
    },
    {
      capacity: 512,
      seed: 3,
      duration: 0.3,
      playMode: 'once',
      emission: {
        rate: 120,
        shape: {
          type: 'circle',
          diameter: 24,
        },
      },
      initial: {
        lifetime: 1.8,
        size: 10,
        speed: 160,
        direction: -1.5707963267948966,
        spread: 0.3,
        red: 1,
        green: 0.8,
        blue: 0.3,
      },
      overLifetime: {
        alpha: {
          points: [
            {
              time: 0,
              value: 0.8,
              tangent: 0,
            },
            {
              time: 1,
              value: 0,
              tangent: 0,
            },
          ],
        },
      },
      id: 'sparks',
      startDelay: 0.15,
      modifiers: [
        {
          type: 'acceleration',
          magnitude: 100,
          rotation: 180,
        },
      ],
      position: {
        x: 35,
        y: 0,
      },
      rendering: {
        blendMode: 'add',
      },
    },
  ],
  modifiers: [
    {
      type: 'acceleration',
      magnitude: 45,
      rotation: 90,
    },
    {
      type: 'acceleration',
      magnitude: 10,
      rotation: 0,
    },
  ],
} satisfies EffectInput;
