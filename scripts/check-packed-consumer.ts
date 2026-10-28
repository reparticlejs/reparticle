import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { build, preview } from 'vite';

import workspace from '../package.json' with { type: 'json' };
import core from '../packages/core/package.json' with { type: 'json' };
import pixi from '../packages/pixi/package.json' with { type: 'json' };
import { chromiumOptions } from './testing/chromium.ts';

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
  copyFileSync(new URL('./consumer/main.ts', import.meta.url), join(consumer, 'main.ts'));
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
    const browser = await chromium.launch(chromiumOptions('webgl2'));
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
