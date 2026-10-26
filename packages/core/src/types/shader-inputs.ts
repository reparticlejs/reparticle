import { d } from 'typegpu';

/** Build-time shader parameters shared by birth and existing-particle updates. */
export const ParticleStep = d
  .struct({
    seconds: d.f32,
    orientToMovement: d.f32,
    orientToAngularVelocity: d.f32,
    rotationCurve: d.f32,
    angularVelocityCurve: d.f32,
  })
  .$name('ParticleStep');

/** Named birth settings decoded from packed vec4 inputs; not a GPU buffer layout. */
export const ParticleBirth = d
  .struct({
    seed: d.f32,
    speed: d.f32,
    direction: d.f32,
    spread: d.f32,
    lifetime: d.f32,
    shapeType: d.f32,
    dimensionX: d.f32,
    dimensionY: d.f32,
    dimensionSpreadX: d.f32,
    dimensionSpreadY: d.f32,
    initialSize: d.f32,
    initialRotation: d.f32,
    initialStretchX: d.f32,
    initialStretchY: d.f32,
    initialRed: d.f32,
    initialGreen: d.f32,
    initialBlue: d.f32,
    initialAlpha: d.f32,
    speedSpread: d.f32,
    lifetimeSpread: d.f32,
    sizeSpread: d.f32,
    rotationSpread: d.f32,
    redSpread: d.f32,
    greenSpread: d.f32,
    blueSpread: d.f32,
    alphaSpread: d.f32,
    angularVelocitySpread: d.f32,
    stretchXSpread: d.f32,
    stretchYSpread: d.f32,
    emitterX: d.f32,
    emitterY: d.f32,
    inheritedVelocityX: d.f32,
    inheritedVelocityY: d.f32,
    emitterCosine: d.f32,
    emitterSine: d.f32,
    emitterScale: d.f32,
    handedness: d.f32,
    orientToDirection: d.f32,
    initialAngularVelocity: d.f32,
  })
  .$name('ParticleBirth');

/** Logical texel address used to read the previous particle state. */
export const ParticleAddress = d
  .struct({
    band: d.f32,
    column: d.f32,
    row: d.f32,
    rows: d.f32,
  })
  .$name('ParticleAddress');
