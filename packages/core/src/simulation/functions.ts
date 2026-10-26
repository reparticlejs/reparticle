// Authored shader exports. Used at build time and in CPU behavior tests only.
export { integrate } from '#simulation/kernels/integrate.js';

export { propertyVariation } from '#simulation/emission/variation.js';
export { spawnBox } from '#simulation/emission/box.js';
export { spawnCircle } from '#simulation/emission/circle.js';
export { spawnCone2D } from '#simulation/emission/cone2d.js';
export { spawnMotion } from '#simulation/emission/motion.js';
export { spawnRotation } from '#simulation/emission/rotation.js';
export { sampleShape } from '#simulation/emission/shape.js';
export { spawnVariation, spawnDirection } from '#simulation/emission/direction.js';

export { applyAcceleration } from '#simulation/modifiers/acceleration.js';
export { applyDrag, applyDragVelocity } from '#simulation/modifiers/drag.js';
export { dispatchModifier } from '#simulation/modifiers/dispatch.js';
export { applyModifiers } from '#simulation/modifiers/list.js';
export { applyRadial } from '#simulation/modifiers/radial.js';
export { applyVortex } from '#simulation/modifiers/vortex.js';

export { advanceAge, particleAlive } from '#simulation/particles/lifetime.js';
export { advanceRotation } from '#simulation/particles/angular-velocity.js';
export { movementRotation } from '#simulation/particles/movement-rotation.js';
export { particleHeading } from '#simulation/particles/heading.js';
export { integrateMotion } from '#simulation/particles/integrate-motion.js';
