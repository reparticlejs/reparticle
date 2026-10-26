import type { Property } from '../types/property';

const fade = {
  points: [
    { time: 0, value: 1 },
    { time: 1, value: 0 },
  ],
};
const modifiers = [{ type: 'acceleration', magnitude: 80, rotation: 180 }];

/** Authored explanations and experiments, shared by the API and lab pages. */
export const properties: Property[] = [
  {
    path: 'id',
    group: 'Emitter',
    description:
      'Unique emitter identifier within this effect. Use it to look up the emitter and bind its artwork. Renaming it does not change motion.',
    default: 'Required',
    value: 'experiment',
  },
  {
    path: 'capacity',
    group: 'Emitter',
    description:
      'Maximum simultaneous particles for this emitter. When all slots are occupied, excess births are dropped and living particles are preserved. Try 64 to see the stream run out of free slots.',
    default: 'Required · integer 1–1,000,000',
    value: 2048,
    range: [16, 4096, 16],
    unit: 'slots',
  },
  {
    path: 'seed',
    group: 'Emitter',
    description:
      'Deterministic random seed. The same definition and playback steps reproduce the same variation. Changing the seed changes the pattern, not the configured ranges.',
    default: 'Required · integer 0–65535',
    value: 42,
    range: [0, 100, 1],
  },
  {
    path: 'playMode',
    group: 'Playback',
    description:
      'Loop repeats the emission cycle. Once runs a single cycle, then lets surviving particles finish. Restart to replay a one-shot effect.',
    default: 'loop',
    value: 'loop',
    choices: ['once', 'loop'],
  },
  {
    path: 'duration',
    group: 'Playback',
    description:
      'Length of the emission cycle. Emitter-lifetime curves use this interval. The experiment emits once so the end of the cycle is visible.',
    default: '1',
    value: 1,
    range: [0.1, 5, 0.1],
    unit: 'seconds',
    setup: { playMode: 'once' },
  },
  {
    path: 'durationSpread',
    group: 'Playback',
    description:
      'Random variation around the authored duration. Restart to observe playback; the seed keeps variation reproducible.',
    default: '0',
    value: 0.5,
    range: [0, 2, 0.1],
    unit: 'seconds',
    setup: { playMode: 'once', duration: 2 },
  },
  {
    path: 'startDelay',
    group: 'Playback',
    description:
      'Wait before emission begins. No particles are born during the delay. Restart the preview to watch it from the beginning.',
    default: '0',
    value: 1,
    range: [0, 4, 0.1],
    unit: 'seconds',
  },
  {
    path: 'startDelaySpread',
    group: 'Playback',
    description:
      'Random variation around the start delay. Used when initializing playback; it does not add a pause between every loop.',
    default: '0',
    value: 1,
    range: [0, 2, 0.1],
    unit: 'seconds',
    setup: { startDelay: 2 },
  },
  {
    path: 'startOffset',
    group: 'Playback',
    description:
      'Prewarm the effect by advancing simulation before displaying its first frame. This performs real simulation work in fixed 1/60-second steps. Compare zero with two seconds.',
    default: '0',
    value: 2,
    range: [0, 4, 0.1],
    unit: 'seconds',
  },
  {
    path: 'position.x',
    group: 'Transform',
    description:
      'Emitter position relative to the effect origin. Positive X moves right. This is independent of the ParticleEffect display-object position.',
    default: '0',
    value: 0,
    range: [-180, 180, 1],
    unit: 'units',
  },
  {
    path: 'position.y',
    group: 'Transform',
    description:
      'Emitter position relative to the effect origin. Positive Y moves down in Pixi canvas coordinates.',
    default: '0',
    value: 0,
    range: [-150, 150, 1],
    unit: 'units',
  },
  {
    path: 'rotation',
    group: 'Transform',
    description:
      'Rotate the emitter and its emission direction. Positive authored angles turn counterclockwise. Pixi display-object rotation uses radians instead.',
    default: '0',
    value: 0,
    range: [-180, 180, 1],
    unit: 'degrees',
  },
  {
    path: 'scale',
    group: 'Transform',
    description:
      'Uniform emitter scale, affecting emission geometry, particle size, and motion. Compare 0.5, 1, and 2.',
    default: '1',
    value: 1,
    range: [0.1, 3, 0.1],
  },
  {
    path: 'space',
    group: 'Transform',
    description:
      'World particles stay behind when the effect moves. Local particles follow its transform. The experiment moves the whole effect so the difference is visible.',
    default: 'world',
    value: 'world',
    choices: ['world', 'local'],
  },
  {
    path: 'inheritVelocity',
    group: 'Transform',
    description:
      'Amount of emitter movement velocity added to newborn particles. Zero adds none; one inherits the full measured velocity. Existing particles keep their own motion.',
    default: '0',
    value: 1,
    range: [0, 2, 0.05],
  },
  {
    path: 'orientation',
    group: 'Appearance',
    description:
      'Choose fixed rotation, alignment with the initial direction, alignment with current movement, or integrated angular velocity. The rectangular artwork makes the orientation visible.',
    default: 'default',
    value: 'default',
    choices: ['default', 'initial-direction', 'movement-direction', 'angular-velocity'],
    setup: { 'initial.angularVelocity': 120, modifiers },
  },
  {
    path: 'stretchWithVelocity',
    group: 'Appearance',
    description:
      'Scale Y stretch by particle speed, using a fixed 60 FPS shutter factor. It needs nonzero stretchY; it does not stretch particles by itself.',
    default: 'false',
    value: false,
    setup: { 'initial.stretchY': 3, 'initial.speed': 180 },
  },
  {
    path: 'emission.rate',
    group: 'Emission',
    description:
      'Particles requested per second. Can be a constant or a curve over normalized emitter lifetime. Capacity still limits the number alive.',
    default: 'Required',
    value: 120,
    range: [0, 600, 1],
    unit: 'particles / second',
  },
  {
    path: 'emission.rateSpread',
    group: 'Emission',
    description:
      'Random variation around the emission rate, sampled for playback. This changes birth frequency rather than particle speed.',
    default: '0',
    value: 60,
    range: [0, 120, 1],
    unit: 'particles / second',
  },
  {
    path: 'emission.shape',
    group: 'Emission',
    description:
      'Spawn from a point, a filled circle, a box, or a 2D cone. Each shape has its own valid fields. Change the JSON type and dimensions together.',
    default: 'Required',
    value: { type: 'circle', diameter: 120 },
  },
  {
    path: 'emission.shape.type',
    group: 'Emission',
    description:
      'Select the shape. Point has no dimensions; circle uses diameter; box and cone2d use width and height. The preview supplies dimensions for the selected shape.',
    default: 'Required',
    value: 'point',
    choices: ['point', 'circle', 'box', 'cone2d'],
  },
  {
    path: 'emission.shape.diameter',
    group: 'Emission',
    description:
      'Circle diameter, not radius. Births sample its filled area. A curve changes the diameter over the emitter cycle.',
    default: 'Required for circle',
    value: 120,
    range: [0, 300, 1],
    unit: 'units',
    setup: { 'emission.shape': { type: 'circle', diameter: 120 } },
  },
  {
    path: 'emission.shape.diameterSpread',
    group: 'Emission',
    description:
      'Variation around the circle diameter. It varies the sampled emitter dimension, rather than moving the whole effect.',
    default: '0',
    value: 60,
    range: [0, 120, 1],
    unit: 'units',
    setup: { 'emission.shape': { type: 'circle', diameter: 120 } },
  },
  {
    path: 'initial.direction',
    group: 'Initial properties',
    description:
      'Base direction for point emission. Zero points right; -π/2 points up. Positive angles turn clockwise in canvas coordinates. Other shapes define their own spawn directions.',
    default: 'Required',
    value: -Math.PI / 2,
    range: [-Math.PI, Math.PI, 0.01],
    unit: 'radians',
  },
  {
    path: 'initial.spread',
    group: 'Initial properties',
    description:
      'Full angular width around the point-emitter direction. Zero produces a straight stream; 2π distributes directions all around.',
    default: 'Required',
    value: Math.PI / 2,
    range: [0, Math.PI * 2, 0.01],
    unit: 'radians',
  },
  {
    path: 'rendering.blendMode',
    group: 'Rendering',
    description:
      'How particle pixels combine with the scene: normal alpha blending, additive light, multiply, or screen. These map directly to Pixi blend modes.',
    default: 'normal',
    value: 'normal',
    choices: ['normal', 'add', 'multiply', 'screen'],
  },
  {
    path: 'modifiers',
    group: 'Modifiers',
    description:
      'Ordered list of acceleration, drag, radial, and vortex forces. Up to 64 per emitter. Emitter modifiers run before effect-level modifiers; repeated types are allowed.',
    default: '[]',
    value: modifiers,
  },
  {
    path: 'effect.modifiers',
    group: 'Effect',
    description:
      'Shared modifiers applied to every emitter after its local modifier list. Up to 64 at effect scope. Positions are relative to the effect.',
    default: '[]',
    value: modifiers,
  },
  {
    path: 'effect.version',
    group: 'Effect',
    description:
      'Configuration format version. The current schema accepts only 1. This is a compatibility marker, not a visual setting.',
    default: 'Required · 1',
    value: 1,
  },
  {
    path: 'effect.emitters',
    group: 'Effect',
    description:
      'Nonempty list of emitters. Each must have a unique ID, capacity, seed, emission settings, and required initial values. Add another emitter to combine effects.',
    default: 'Required · at least one',
    value: [
      {
        id: 'left',
        capacity: 512,
        seed: 1,
        position: { x: -80 },
        emission: { rate: 50, shape: { type: 'point' } },
        initial: { lifetime: 2, speed: 70, direction: -1.57, spread: 1, size: 10 },
      },
      {
        id: 'right',
        capacity: 512,
        seed: 2,
        position: { x: 80 },
        emission: { rate: 50, shape: { type: 'point' } },
        initial: {
          lifetime: 2,
          speed: 70,
          direction: -1.57,
          spread: 1,
          size: 10,
          red: 1,
          green: 0.3,
          blue: 0.4,
        },
      },
    ],
  },
];

for (const axis of ['width', 'height']) {
  properties.push(
    {
      path: `emission.shape.${axis}`,
      group: 'Emission',
      description: `Box or cone ${axis}. Constants and curves over emitter lifetime are supported. This experiment uses a box.`,
      default: 'Required for box / cone2d',
      value: 120,
      range: [0, 300, 1],
      unit: 'units',
      setup: { 'emission.shape': { type: 'box', width: 120, height: 120 } },
    },
    {
      path: `emission.shape.${axis}Spread`,
      group: 'Emission',
      description: `Random variation around the authored ${axis}. The nominal dimension stays unchanged.`,
      default: '0',
      value: 60,
      range: [0, 120, 1],
      unit: 'units',
      setup: { 'emission.shape': { type: 'box', width: 120, height: 120 } },
    },
  );
}

const initial = [
  [
    'lifetime',
    'Seconds each particle remains alive. Longer lifetimes require more capacity at the same emission rate.',
    'Required',
    2,
    0.1,
    5,
    'seconds',
  ],
  [
    'speed',
    'Initial velocity magnitude. Changing it affects new particles; modifiers change velocity afterward.',
    'Required',
    90,
    0,
    300,
    'units / second',
  ],
  [
    'size',
    'Particle size in manual texture sizing mode. Initial size is multiplied by overLifetime.scale.',
    '24',
    12,
    1,
    60,
    'units',
  ],
  [
    'rotation',
    'Initial particle rotation. Positive angles turn counterclockwise. It is added to orientation and lifetime rotation.',
    '0',
    0,
    -180,
    180,
    'degrees',
  ],
  [
    'angularVelocity',
    'Spin speed used by angular-velocity orientation. Integrated over simulation time.',
    '0',
    120,
    -360,
    360,
    'degrees / second',
  ],
  [
    'stretchX',
    'Extra horizontal stretch. Zero keeps original width; one adds another full width.',
    '0',
    0,
    -0.9,
    4,
    'additional scale',
  ],
  [
    'stretchY',
    'Extra vertical stretch. Zero keeps original height; one doubles it.',
    '0',
    0,
    -0.9,
    4,
    'additional scale',
  ],
  [
    'red',
    'Initial red channel, multiplied by lifetime red and rendering tint.',
    '1',
    0.6,
    0,
    1,
    '0–1',
  ],
  [
    'green',
    'Initial green channel, multiplied by lifetime green and rendering tint.',
    '1',
    0.9,
    0,
    1,
    '0–1',
  ],
  [
    'blue',
    'Initial blue channel, multiplied by lifetime blue and rendering tint.',
    '1',
    1,
    0,
    1,
    '0–1',
  ],
  [
    'alpha',
    'Initial opacity, multiplied by lifetime alpha, emitter tint, and display-object alpha.',
    '1',
    1,
    0,
    1,
    '0–1',
  ],
] as const;

for (const [name, description, defaultValue, value, min, max, unit] of initial) {
  const setup = name === 'angularVelocity' ? { orientation: 'angular-velocity' } : {};
  properties.push(
    {
      path: `initial.${name}`,
      group: 'Initial properties',
      description: `${description} Accepts a number or a curve sampled at birth using normalized emitter lifetime.`,
      default: defaultValue,
      value,
      range: [min, max, max <= 5 ? 0.01 : 1],
      unit,
      setup,
    },
    {
      path: `initial.${name}Spread`,
      group: 'Initial spread',
      description: `Per-particle variation added to initial.${name}: base + a deterministic value between -1 and 1 × spread. Zero gives every particle the same base value.`,
      default: '0',
      value: Math.abs(value) / 2 || 0.5,
      range: [0, max, max <= 5 ? 0.01 : 1],
      unit,
      setup,
    },
  );
}

for (const name of [
  'scale',
  'stretchX',
  'stretchY',
  'rotation',
  'angularVelocity',
  'red',
  'green',
  'blue',
  'alpha',
]) {
  const additive = ['stretchX', 'stretchY', 'rotation'].includes(name);
  const setup: Record<string, unknown> =
    name === 'angularVelocity'
      ? { orientation: 'angular-velocity', 'initial.angularVelocity': 180 }
      : {};
  properties.push({
    path: `overLifetime.${name}`,
    group: 'Over lifetime',
    description: `${additive ? 'Added to' : 'Multiplies'} the particle’s initial ${name === 'scale' ? 'size' : name}. A number stays constant; a curve follows each particle from birth at time 0 to expiration at time 1.`,
    default: additive ? '0' : '1',
    value:
      name === 'rotation'
        ? {
            points: [
              { time: 0, value: 0 },
              { time: 1, value: 180 },
            ],
          }
        : fade,
    setup,
  });
}

for (const channel of ['red', 'green', 'blue', 'alpha']) {
  properties.push({
    path: `rendering.tint.${channel}`,
    group: 'Rendering',
    description: `Rendering-only ${channel} multiplier. Applies after per-particle color and opacity. One leaves the channel unchanged; zero removes it.`,
    default: '1',
    value: 1,
    range: [0, 1, 0.01],
    setup: { 'rendering.tint': { red: 1, green: 1, blue: 1, alpha: 1 } },
  });
}

const modifierDescriptions: Record<string, string> = {
  acceleration:
    'Constant force along the rotated local up direction. Changes velocity every simulation step.',
  drag: 'Velocity damping. Positive strength slows particles; directional mode damps only the selected axis.',
  radial: 'Force away from a center, with distance falloff. Negative magnitude attracts particles.',
  vortex:
    'Tangential force around a center, with distance falloff. Change the sign to reverse circulation.',
};
for (const [type, description] of Object.entries(modifierDescriptions)) {
  const base = { type, magnitude: type === 'drag' ? 1 : 80 };
  properties.push({
    path: `modifiers.0.magnitude`,
    group: `${type} modifier`,
    description: `${description} Accepts a number or a curve. Curve time 1 equals the configured emitter duration; beyond 1, the curve continues along its final slope.`,
    default: '0',
    value: base.magnitude,
    range: type === 'drag' ? [0, 5, 0.05] : [-200, 200, 1],
    setup: { modifiers: [base], 'initial.spread': Math.PI * 2 },
  });
  for (const field of [
    'spread',
    ...(type !== 'radial' ? ['rotation'] : []),
    ...(['radial', 'vortex'].includes(type) ? ['x', 'y', 'maxDistance'] : []),
    ...(type === 'drag' ? ['useDirection'] : []),
  ]) {
    const value = field === 'useDirection' ? false : field === 'maxDistance' ? 100 : 0;
    const descriptions: Record<string, string> = {
      spread: 'Variation in modifier strength for individual particles.',
      rotation: 'Counterclockwise rotation of the modifier axis, in degrees.',
      x: 'Horizontal center of the modifier in its authored scope.',
      y: 'Vertical center of the modifier in its authored scope.',
      maxDistance: 'Distance over which the force falls off to zero.',
      useDirection: 'Damp velocity along the rotated axis instead of damping all directions.',
    };
    properties.push({
      path: `modifiers.0.${field}`,
      group: `${type} modifier`,
      description: descriptions[field],
      default: String(value),
      value,
      ...(typeof value === 'number'
        ? {
            range:
              field === 'rotation'
                ? [-180, 180, 1]
                : field === 'x' || field === 'y'
                  ? [-150, 150, 1]
                  : [0, 200, 1],
          }
        : {}),
      setup: { modifiers: [base], 'initial.spread': Math.PI * 2 },
    });
  }
}

properties.push({
  path: 'overLifetime.alpha',
  label: 'Curves',
  group: 'Curves',
  description:
    'Shape particle opacity over its lifetime. Edit point times, values, and tangents, then apply the curve to the preview. Time runs from birth (0) to expiration (1). A tangent controls the slope through a point.',
  default: '1 to 0',
  value: fade,
});
properties.push({
  path: 'modifiers.0.type',
  group: 'Modifiers',
  description:
    'Modifier discriminator. Acceleration pushes, drag slows, radial pushes away from a center, and vortex circulates around it. Each type has its own valid fields.',
  default: 'Required',
  value: 'acceleration',
  choices: ['acceleration', 'drag', 'radial', 'vortex'],
  setup: { modifiers: [{ type: 'acceleration', magnitude: 20 }] },
});

const artworkSetup = {
  'initial.size': 32,
  'initial.speed': 30,
  'initial.lifetime': 3,
  'emission.rate': 8,
};
properties.push(
  {
    path: 'artwork.sizeMode',
    group: 'Artwork',
    description:
      'Manual uses initial particle size. Auto uses texture-frame dimensions and treats initial size as a multiplier. The same numeric size therefore has a very different effect.',
    default: 'manual',
    value: 'manual',
    choices: ['manual', 'auto'],
    setup: { ...artworkSetup, 'initial.size': 1 },
  },
  {
    path: 'artwork.flipX',
    group: 'Artwork',
    description:
      'Mirror artwork horizontally without changing particle motion. This preview uses a rotating coin atlas.',
    default: 'false',
    value: false,
    setup: artworkSetup,
  },
  {
    path: 'artwork.flipY',
    group: 'Artwork',
    description: 'Mirror artwork vertically without changing particle motion.',
    default: 'false',
    value: false,
    setup: artworkSetup,
  },
  {
    path: 'artwork.pivot.x',
    group: 'Artwork',
    description:
      'Horizontal artwork offset from the particle center, scaled with particle geometry. Positive values shift artwork right.',
    default: '0',
    value: 0,
    range: [-2, 2, 0.05],
    setup: artworkSetup,
  },
  {
    path: 'artwork.pivot.y',
    group: 'Artwork',
    description:
      'Vertical artwork offset from the particle center. Positive values shift artwork up, unlike canvas Y.',
    default: '0',
    value: 0,
    range: [-2, 2, 0.05],
    setup: artworkSetup,
  },
  {
    path: 'artwork.playback',
    group: 'Artwork',
    description:
      'Once modes span particle lifetime. Loop modes use FPS. None freezes the first frame. Animation requires at least two frames from one texture source.',
    default: 'loop-forward',
    value: 'loop-forward',
    choices: [
      'none',
      'once-forward',
      'once-backward',
      'once-pingpong',
      'loop-forward',
      'loop-backward',
      'loop-pingpong',
    ],
    setup: artworkSetup,
  },
  {
    path: 'artwork.fps',
    group: 'Artwork',
    description:
      'Frames per second for looping animation. Once modes use particle lifetime instead. Set zero to stop frame advancement.',
    default: '30',
    value: 12,
    range: [0, 60, 1],
    unit: 'frames / second',
    setup: artworkSetup,
  },
  {
    path: 'artwork.animationSize',
    group: 'Artwork',
    description:
      'Reference width and height for animation geometry. The first frame’s original size is used when omitted. This sets a consistent aspect across the sequence.',
    default: 'First frame original dimensions',
    value: { width: 64, height: 64 },
    setup: artworkSetup,
  },
);

// Only fields backed by the core scalar-property schema offer curves.
for (const property of properties) {
  const path = property.path;
  if (path.startsWith('overLifetime.')) {
    property.curve = 'particle';
  } else if (
    path.startsWith('initial.') &&
    !path.endsWith('Spread') &&
    !['initial.direction', 'initial.spread'].includes(path)
  ) {
    property.curve = 'emitter';
  } else if (
    [
      'emission.rate',
      'emission.shape.width',
      'emission.shape.height',
      'emission.shape.diameter',
    ].includes(path)
  ) {
    property.curve = 'emitter';
  } else if (path === 'modifiers.0.magnitude') {
    property.curve = 'modifier';
  }
}

// Related components share one experiment, while keeping their actual JSON field names.
const groups: (readonly [string, readonly string[], string?])[] = [
  ['playback', ['playMode', 'duration', 'durationSpread']],
  ['startDelay', ['startDelay', 'startDelaySpread']],
  ['transform', ['position.x', 'position.y', 'rotation', 'scale']],
  ['emission.rate', ['emission.rate', 'emission.rateSpread']],
  ['emission.shape.diameter', ['emission.shape.diameter', 'emission.shape.diameterSpread']],
  ['artwork.flip', ['artwork.flipX', 'artwork.flipY']],
  ['artwork.animation', ['artwork.playback', 'artwork.fps']],
  ...Object.keys(modifierDescriptions).map((type): [string, string[], string] => [
    `modifiers.${type}`,
    properties
      .filter((property) => property.group === `${type} modifier`)
      .map((property) => property.path),
    `${type} modifier`,
  ]),
  ['initial.direction', ['initial.direction', 'initial.spread']],
  ...['lifetime', 'speed', 'size', 'rotation', 'angularVelocity', 'alpha'].map(
    (name) => [`initial.${name}`, [`initial.${name}`, `initial.${name}Spread`]] as const,
  ),
  [
    'initial.color',
    [
      'initial.red',
      'initial.redSpread',
      'initial.green',
      'initial.greenSpread',
      'initial.blue',
      'initial.blueSpread',
    ],
  ],
  ['overLifetime.color', ['overLifetime.red', 'overLifetime.green', 'overLifetime.blue']],
  [
    'initial.stretch',
    ['initial.stretchX', 'initial.stretchXSpread', 'initial.stretchY', 'initial.stretchYSpread'],
  ],
  ['overLifetime.stretch', ['overLifetime.stretchX', 'overLifetime.stretchY']],
  [
    'emission.shape.dimensions',
    [
      'emission.shape.width',
      'emission.shape.widthSpread',
      'emission.shape.height',
      'emission.shape.heightSpread',
    ],
  ],
  [
    'rendering',
    [
      'rendering.blendMode',
      'rendering.tint.red',
      'rendering.tint.green',
      'rendering.tint.blue',
      'rendering.tint.alpha',
    ],
  ],
  ['artwork.pivot', ['artwork.pivot.x', 'artwork.pivot.y']],
];

const groupDescriptions: Record<string, string> = {
  playback:
    'Emission cycle mode, duration, and duration spread. Once emits for one cycle; loop repeats. Restart to observe randomized cycle timing.',
  startDelay:
    'Delay before emission starts, with random variation around that delay. Restart to observe the timing.',
  transform:
    'Emitter position, rotation, and uniform scale relative to the effect. Adjust these together to place and size the emitter.',
  'emission.rate':
    'Births requested per second and their random rate spread. Capacity limits how many particles can stay alive. Changing spread restarts playback; numeric rate changes apply live.',
  'emission.shape.diameter':
    'Circle diameter and its random variation. Births sample the filled circle; each dimension accepts a constant or an emitter-lifetime curve.',
  'artwork.flip':
    'Mirror artwork horizontally, vertically, or both, without changing particle motion.',
  'artwork.animation':
    'Animation playback mode and FPS. Loop modes use FPS; once modes span particle lifetime. None freezes the first frame.',
  'overLifetime.alpha.points.0':
    'Edit the time, value, and tangent of the first point together. This experiment uses particle opacity; times must remain strictly increasing.',

  'initial.direction':
    'Point-emitter direction and the full angular spread around it, in radians. Zero spread produces a straight stream; 2π distributes directions all around.',
  'initial.color':
    'Birth color as red, green, and blue channels from 0 to 1. Each channel accepts a number or an emitter-lifetime curve. Lifetime color and rendering tint multiply this color afterward.',
  'overLifetime.color':
    'Red, green, and blue multipliers over each particle’s lifetime. Use curves to change color from birth at time 0 to expiration at time 1.',
  'initial.stretch':
    'Additional horizontal and vertical stretch at birth. Zero keeps the original dimension; one doubles it. Each axis accepts a number or an emitter-lifetime curve.',
  'overLifetime.stretch':
    'Horizontal and vertical stretch added to birth stretch as particles age. Constants and particle-lifetime curves are supported.',
  position:
    'Emitter X/Y position relative to the effect origin. Positive X moves right; positive Y moves down.',
  'emission.shape.dimensions':
    'Width and height of a box or cone emitter, with independent spread for each dimension. Constants and emitter-lifetime curves are supported. This experiment uses a box.',
  'emission.shape.dimensionSpread':
    'Independent random variation around the emitter’s width and height. This experiment uses a box.',
  rendering:
    'Blend mode controls how particles combine with the scene: normal, add, multiply, or screen. Tint applies emitter-wide red, green, blue, and alpha multipliers. One leaves a channel unchanged; zero removes it. Changes affect existing particles immediately.',
  'artwork.pivot':
    'Horizontal and vertical particle pivot offsets. Adjust both axes together to change the anchor used for particle geometry.',
};

for (const [path, paths, group] of groups) {
  const fields = paths.flatMap((field) =>
    properties.filter(
      (property) => property.path === field && (!group || property.group === group),
    ),
  );
  const first = fields[0];
  if (!first) {
    continue;
  }
  const index = properties.indexOf(first);
  const combined: Property = {
    path,
    group: first.group,
    description: `${groupDescriptions[path] ?? first.description}${path.startsWith('initial.') && path !== 'initial.direction' ? ' Spread adds independent random variation around each birth value. Zero keeps that value unchanged.' : ''}`,
    default: fields.map((field) => `${field.path.split('.').at(-1)}: ${field.default}`).join(' · '),
    value: Object.fromEntries(fields.map((field) => [field.path.split('.').at(-1)!, field.value])),
    setup: first.setup,
    fields,
  };
  properties.splice(index, 0, combined);
  for (let i = properties.length - 1; i >= 0; i--) {
    const property = properties[i];
    if (property !== combined && (fields.includes(property) || property.path === path)) {
      properties.splice(i, 1);
    }
  }
}

// Keep structural modifier documentation out of the hands-on lab.
for (const property of properties) {
  if (['modifiers', 'modifiers.0.type', 'effect.modifiers'].includes(property.path)) {
    property.lab = false;
  }
  const type = property.path.slice('modifiers.'.length);
  if (!(type in modifierDescriptions)) {
    continue;
  }
  property.label = type[0].toUpperCase() + type.slice(1);
  property.group = 'Modifiers';
  property.description = modifierDescriptions[type];
  const labels: Record<string, string> = {
    magnitude: 'Strength',
    spread: 'Spread',
    rotation: 'Direction',
    x: 'Center X',
    y: 'Center Y',
    maxDistance: 'Range',
    useDirection: 'Directional drag',
  };
  for (const field of property.fields ?? []) {
    const key = field.path.split('.').at(-1)!;
    field.label = labels[key];
    if (key === 'rotation') {
      field.unit = 'degrees';
    }
    if (['x', 'y', 'maxDistance'].includes(key)) {
      field.unit = 'units';
    }
    if (type === 'drag' && key === 'rotation') {
      field.visibleWhen = 'useDirection';
    }
  }
  // Put the direction toggle before the control it reveals.
  if (type === 'drag') {
    property.fields?.sort(
      (a, b) => Number(a.path.endsWith('rotation')) - Number(b.path.endsWith('rotation')),
    );
  }
}

export const labProperties = properties.filter((property) => property.lab !== false);

/** Modifier paths repeat across types; include the group in their route identifier. */
export function propertyId(property: Property): string {
  return `${property.group}-${property.path}`.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
}
