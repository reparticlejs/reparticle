// Build entry only; runtime code imports the generated function strings.
export { initialize } from './kernels/initialize';
export { integrate } from './kernels/integrate';

export { propertyVariation } from './emission/variation';
export { spawnBox } from './emission/box';
export { spawnCircle } from './emission/circle';
export { spawnCone2D } from './emission/cone2d';
export { spawnMotion } from './emission/motion';
export { spawnRotation } from './emission/rotation';
export { sampleShape } from './emission/shape';
export { spawnVariation, spawnDirection } from './emission/direction';

export { applyAcceleration } from './modifiers/acceleration';
export { applyDrag } from './modifiers/drag';
export { applyModifiers } from './modifiers/apply-modifiers';
export { applyRadial } from './modifiers/radial';
export { applyVortex } from './modifiers/vortex';

export { advanceAge, particleAlive } from './particles/lifetime';
export { advanceRotation } from './particles/angular-velocity';
export { movementRotation } from './particles/movement-rotation';
export { particleHeading } from './particles/heading';
export { integrateMotion } from './particles/integrate-motion';
