import { d } from 'typegpu';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createSimulationParameters } from '#runtime/shared/parameters.js';
import { WebGL2Simulation } from '#runtime/webgl2/particle-simulation.js';
import { MODIFIER_WORDS, MODIFIER_HEADER, MODIFIER_STRIDE } from '#simulation/data-layout.js';
import { applyNoise } from '#simulation/modifiers/noise.js';

let gl: WebGL2RenderingContext;
let canvas: HTMLCanvasElement;
let framebuffer: WebGLFramebuffer;
let simulations: WebGL2Simulation[];

beforeEach(() => {
  simulations = [];
  canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2');
  if (!context || !context.getExtension('EXT_color_buffer_float')) {
    throw new Error('Browser tests require WebGL2 and floating-point render targets');
  }
  gl = context;
  framebuffer = gl.createFramebuffer()!;
  simulations = [];
});

afterEach(() => {
  for (const instance of simulations) {
    instance.destroy();
  }
  if (gl) {
    gl.deleteFramebuffer(framebuffer);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
  vi.restoreAllMocks();
});

function simulation(width = 4, rows = 1) {
  const result = new WebGL2Simulation({ gl, canvas }, width, rows, width * rows);
  simulations.push(result);
  result.reset();
  return result;
}

function parameters(capacity = 4) {
  const result = createSimulationParameters();
  result.step = { seconds: 1 / 60, birthCount: capacity, seed: 42 };
  result.emission = { speed: 60, direction: -Math.PI / 2, spread: 0, lifetime: 2 };
  result.appearance.size = 12;
  result.color = { red: 0.25, green: 0.5, blue: 1, alpha: 1 };
  result.transform = { cosine: 1, sine: 0, scale: 1, handedness: 1 };
  result.spawnMask = new Float32Array(Math.ceil(capacity / 24));
  for (let slot = 0; slot < capacity; slot++) {
    result.spawnMask[Math.floor(slot / 24)]! += 2 ** (slot % 24);
  }
  result.rotationCurve = new Float32Array(65);
  result.angularVelocityCurve = new Float32Array(65).fill(1);
  result.modifiers = new Float32Array(MODIFIER_WORDS);
  return result;
}

function read(texture: WebGLTexture, width: number, height: number) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  expect(gl.checkFramebufferStatus(gl.FRAMEBUFFER)).toBe(gl.FRAMEBUFFER_COMPLETE);
  const data = new Float32Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  expect(gl.getError()).toBe(gl.NO_ERROR);
  return Array.from(data);
}

it('preserves high-precision state and 24-bit spawn flags across texture rows', () => {
  const sim = simulation(5, 5);
  const input = parameters(25);
  input.position.x = 4096.25;
  input.position.y = -2048.5;
  sim.update(input);
  const state = read(sim.texture, 5, 10);
  const birth = read(sim.birthTexture, 5, 15);
  for (let slot = 0; slot < 25; slot++) {
    expect(state[slot * 4]).toBeCloseTo(4096.25, 3);
    expect(state[slot * 4 + 1]).toBeCloseTo(-2049.5, 3);
    expect(state[slot * 4 + 3]).toBeCloseTo(-60, 4);
    expect(state[(25 + slot) * 4 + 1]).toBe(1);
    expect(birth[slot * 4]).toBe(2);
    expect(birth[slot * 4 + 1]).toBe(12);
  }
  input.step.birthCount = 0;
  sim.update(input);
  expect(read(sim.texture, 5, 10)[1]).toBeCloseTo(-2050.5, 3);
});

it('keeps zero-time updates still, expires particles, and resets both state textures', () => {
  const sim = simulation();
  const input = parameters();
  input.emission.lifetime = 0.05;
  sim.update(input);
  const state = read(sim.texture, 4, 2);
  input.step.birthCount = 0;
  input.step.seconds = 0;
  sim.update(input);
  expect(read(sim.texture, 4, 2)).toEqual(state);
  input.step.seconds = 0.1;
  sim.update(input);
  expect(read(sim.texture, 4, 2)[17]).toBe(0);
  sim.reset();
  expect(read(sim.texture, 4, 2).every((value) => value === 0)).toBe(true);
  expect(read(sim.birthTexture, 4, 3).every((value) => value === 0)).toBe(true);
});

it('recycles only flagged slots and preserves the other birth records', () => {
  const sim = simulation();
  const input = parameters();
  sim.update(input);
  const before = read(sim.birthTexture, 4, 3);
  input.step.birthCount = 1;
  input.spawnMask[0] = 2;
  input.appearance.size = 99;
  sim.update(input);
  const after = read(sim.birthTexture, 4, 3);
  expect(after[5]).toBe(99);
  for (const slot of [0, 2, 3]) {
    expect(after.slice(slot * 4, slot * 4 + 4)).toEqual(before.slice(slot * 4, slot * 4 + 4));
  }
});

it('shares one program per context and keeps a surviving simulation usable', () => {
  const createProgram = vi.spyOn(gl, 'createProgram');
  const deleteProgram = vi.spyOn(gl, 'deleteProgram');
  const first = simulation();
  const second = simulation();
  expect(createProgram).toHaveBeenCalledTimes(1);
  first.destroy();
  first.destroy();
  expect(deleteProgram).not.toHaveBeenCalled();
  second.update(parameters());
  expect(read(second.texture, 4, 2)[17]).toBe(1);
  second.destroy();
  expect(deleteProgram).toHaveBeenCalledTimes(1);
});

it('keeps steady motion correct through 1,200 ping-pong updates', () => {
  const sim = simulation();
  const input = parameters();
  input.emission.lifetime = 30;
  sim.update(input);
  input.step.birthCount = 0;
  for (let step = 1; step < 1200; step++) {
    sim.update(input);
  }
  const state = read(sim.texture, 4, 2);
  expect(state[1]).toBeCloseTo(-1200, 2);
  expect(state[16]).toBeCloseTo(20, 2);
  expect(state[17]).toBe(1);
});

it('reads all 128 modifier records from the packed uniform buffer', () => {
  const sim = simulation();
  const input = parameters();
  input.modifiers[0] = 128;
  for (let index = 0; index < 128; index++) {
    input.modifiers.set([0, 60, 0, 0, 0, 1, 0, 0, 0], MODIFIER_HEADER + index * MODIFIER_STRIDE);
  }
  sim.update(input);
  const state = read(sim.texture, 4, 2);
  expect(state[2]).toBeCloseTo(128, 3);
  expect(state[0]).toBeCloseTo(128 / 60, 3);
});

it('matches CPU noise forces at negative coordinates and high seeds', () => {
  const sim = simulation();
  const input = parameters();
  input.position.x = -37;
  input.position.y = 19;
  input.emission.speed = 0;
  input.modifiers[0] = 1;
  input.modifiers.set([4, 80, 0, 0, 0, 1, 0, 0, 1, 0.02, 0.37, 65535], MODIFIER_HEADER);
  sim.update(input);
  const force = applyNoise(d.vec2f(-37, 19), d.vec2f(0, 0), d.vec2f(1, 0), 0.02, 0.37, 65535, 1);
  const state = read(sim.texture, 4, 2);
  expect(state[2]).toBeCloseTo((force.x * 80) / 60, 3);
  expect(state[3]).toBeCloseTo((force.y * 80) / 60, 3);
});
