// JavaScript source strings are intentional: GPU.js compiles these functions at runtime.
// Keeping source strings prevents bundlers/minifiers from rewriting kernel syntax.
export const initialize = `function initialize() { return [0, 0, 0, 0]; }`;

// Each particle has two RGBA texels: [x,y,vx,vy] and [age,lifetime,alive,0].
// Both rows read the previous state, so spawning and expiration are consistent.
export const integrate = `function integrate(state, dt, start, count, x, y, speed, angle, spread, gravity, lifetime, seed) {
  const row = this.thread.y % this.constants.rows;
  const id = row * this.constants.width + this.thread.x;
  const offset = (id - start + this.constants.capacity) % this.constants.capacity;
  const meta = state[row + this.constants.rows][this.thread.x];
  const born = id < this.constants.capacity && offset < count;
  if (this.thread.y >= this.constants.rows) {
    if (born) return [0, lifetime, 1, 0];
    return [meta[0] + dt, meta[1], meta[2], 0];
  }
  if (born) {
    const h = Math.sin(id * 12.9898 + seed * 0.137) * 43758.5453;
    const r = h - Math.floor(h);
    const direction = angle + (r - 0.5) * spread;
    const velocity = speed * (0.7 + r * 0.3);
    return [x, y, Math.cos(direction) * velocity, Math.sin(direction) * velocity];
  }
  const p = state[row][this.thread.x];
  if (meta[2] < 0.5 || meta[0] >= meta[1]) return [p[0], p[1], 0, 0];
  return [p[0] + p[2] * dt, p[1] + p[3] * dt + 0.5 * gravity * dt * dt, p[2], p[3] + gravity * dt];
}`;
