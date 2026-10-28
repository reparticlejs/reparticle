import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { build, preview } from 'vite';

import workspace from '../package.json' with { type: 'json' };
import core from '../packages/core/package.json' with { type: 'json' };
import pixi from '../packages/pixi/package.json' with { type: 'json' };

/** Install unchanged tarballs outside the workspace and verify their public API and rendering. */
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const consumer = mkdtempSync(join(tmpdir(), 'reparticle-consumer-'));
const pnpmPath = process.env.npm_execpath;
if (!pnpmPath) {
  throw new Error('Run through pnpm packages:check.');
}

function pnpm(cwd: string, ...args: string[]): void {
  execFileSync(process.execPath, [pnpmPath!, ...args], { cwd, stdio: 'inherit' });
}

/** Read an installed tool version so the isolated consumer uses the same reviewed dependencies. */
function version(file: string): string {
  const manifest: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (
    typeof manifest === 'object' &&
    manifest !== null &&
    'version' in manifest &&
    typeof manifest.version === 'string'
  ) {
    return manifest.version;
  }
  throw new Error(`Missing version: ${file}`);
}

function json(file: string, value: unknown): void {
  writeFileSync(join(consumer, file), JSON.stringify(value, null, 2));
}

try {
  const dependencies: Record<string, string> = {};
  for (const [folder, manifest] of [
    ['core', core],
    ['pixi', pixi],
  ] as const) {
    pnpm(join(root, 'packages', folder), 'pack', '--pack-destination', consumer);
    dependencies[manifest.name] = `file:./reparticle-${folder}-${manifest.version}.tgz`;
  }
  dependencies['pixi.js'] = version(join(root, 'packages/pixi/node_modules/pixi.js/package.json'));
  json('package.json', {
    private: true,
    type: 'module',
    dependencies,
    devDependencies: {
      typescript: version(require.resolve('@typescript/native/package.json')),
      '@typescript/lib-dom': workspace.devDependencies['@typescript/lib-dom'],
    },
    // Unpublished core versions must resolve to the local tarball, never an older registry release.
    pnpm: { overrides: { '@reparticle/core': dependencies['@reparticle/core'] } },
  });
  writeFileSync(join(consumer, 'pnpm-workspace.yaml'), 'autoInstallPeers: false\n');
  json('tsconfig.json', {
    compilerOptions: {
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      target: 'ES2022',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      moduleResolution: 'Bundler',
    },
    files: ['main.ts'],
  });
  writeFileSync(
    join(consumer, 'index.html'),
    '<!doctype html><html><head><link rel="icon" href="data:,"></head><body><script type="module" src="/main.ts"></script></body></html>',
  );
  writeFileSync(
    join(consumer, 'main.ts'),
    `
import { parseEffectConfig, effectConfigSchema, EmitterController } from '@reparticle/core';
import { Emitter as WebGL2Emitter } from '@reparticle/core/webgl2';
import { ParticleEffect, type EffectInput, type ParticleEffectOptions } from '@reparticle/pixi';
import { ParticleEffect as WebGL2Effect } from '@reparticle/pixi/webgl2';
import { ParticleEffect as WebGPUEffect } from '@reparticle/pixi/webgpu';
import { Emitter as WebGPUEmitter } from '@reparticle/core/webgpu';
import { Application, Texture, Rectangle, type WebGLRenderer } from 'pixi.js';

const definition: EffectInput = { version: 1, emitters: [{
  id: 'smoke', capacity: 64, seed: 42,
  emission: { rate: 60, shape: { type: 'point' } },
  initial: { lifetime: 2, speed: 0, direction: 0, spread: 0, size: 32 },
}] };
const sameAPI: typeof ParticleEffect[] = [WebGL2Effect, WebGPUEffect];
if (sameAPI.length !== 2 || typeof WebGPUEmitter !== 'function' || typeof WebGL2Emitter !== 'function' || typeof EmitterController !== 'function') throw new Error('Missing explicit backend exports');
const options: ParticleEffectOptions = { autoUpdate: false, emitters: { smoke: { textures: [Texture.WHITE] } } };
parseEffectConfig(definition);
if (effectConfigSchema.safeParse({}).success) throw new Error('Invalid effect accepted');
const app = new Application<WebGLRenderer>();
await app.init({ width: 128, height: 128, preference: 'webgl', preferWebGLVersion: 2, autoStart: false });
document.body.append(app.canvas);
const effect = new ParticleEffect(definition, options);
effect.position.set(64, 64);
app.stage.addChild(effect);
app.render();
effect.update(0.1);
app.render();
const pixels = app.renderer.extract.pixels({ target: app.stage, frame: new Rectangle(0, 0, 128, 128) }).pixels;
if (pixels[(64 * 128 + 64) * 4]! < 200 || effect.emitter.particleCount === 0) throw new Error('Particles did not render');
effect.destroy();
app.destroy(true, { children: true });
document.body.dataset.passed = 'true';
`,
  );
  pnpm(consumer, 'install', '--no-frozen-lockfile', '--ignore-scripts');
  pnpm(consumer, 'audit', '--prod', '--audit-level', 'high');
  pnpm(consumer, 'exec', 'tsc', '-p', 'tsconfig.json');
  await build({ root: consumer, configFile: false, logLevel: 'warn', build: { target: 'es2022' } });
  const server = await preview({
    root: consumer,
    configFile: false,
    preview: { host: '127.0.0.1', port: 0 },
  });
  try {
    const browser = await chromium.launch({ channel: 'chromium', headless: true });
    try {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        // The pixel assertion deliberately waits for a GPU readback. Some drivers
        // report that stall; keep it visible without treating it as an app failure.
        if (
          message.type() === 'warning' &&
          /^\[\.WebGL-[^\]]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels$/.test(
            message.text(),
          )
        ) {
          console.warn(message.text());
          return;
        }
        if (message.type() === 'error' || message.type() === 'warning') {
          errors.push(message.text());
        }
      });
      await page.goto(server.resolvedUrls!.local[0]!);
      await page.waitForFunction(() => document.body.dataset.passed === 'true');
      if (errors.length) {
        throw new Error(errors.join('\n'));
      }
    } finally {
      await browser.close();
    }
  } finally {
    await server.close();
  }
  console.log(
    'Packed consumer passed: installation, dependency audit, TypeScript, and WebGL2 rendering.',
  );
  rmSync(consumer, { recursive: true, force: true });
} catch (error) {
  console.error(`Consumer retained for inspection: ${consumer}`);
  throw error;
}
