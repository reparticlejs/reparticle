// Build input only. The runtime imports the generated source strings instead.
export { circleAngle, circleRadius } from '../behaviors/circle';
export { applyGravity } from '../behaviors/gravity';
export { advanceAge, particleAlive } from '../behaviors/lifetime';
export { advancePosition, advanceVelocity } from '../behaviors/motion';
export { spawnVariation, spawnDirection } from '../behaviors/spawn';
export { initialize } from './initialize';
export { integrate } from './integrate';
export { spawnBox } from './spawn-box';
export { spawnCircle } from './spawn-circle';
export { spawnMotion } from './spawn-motion';
