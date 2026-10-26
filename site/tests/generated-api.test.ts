import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

const root = fileURLToPath(new URL('../src/content/api/', import.meta.url));
const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replaceAll('\\', '/'));

it('generates both packages and the public display object API', () => {
  expect(files).toContain('core/index.md');
  expect(files).toContain('pixi/index.md');
  const effect = readFileSync(path.join(root, 'pixi/classes/ParticleEffect.md'), 'utf8');
  expect(effect).toContain('## Constructors');
  expect(effect).toContain('[`ParticleEffectOptions`](../../interfaces/ParticleEffectOptions/)');
  expect(effect).not.toContain('configureRendering');
});

it('resolves every generated local page link', () => {
  for (const file of files) {
    const source = readFileSync(path.join(root, file), 'utf8');
    const route = path.join(root, file.replace(/(?:\/index)?\.md$/, ''));
    for (const match of source.matchAll(/\]\(([^)\s]+)\)/g)) {
      const href = match[1];
      if (!href) {
        continue;
      }
      if (/^(?:https?:|mailto:|#)/.test(href)) {
        continue;
      }
      const target = path.resolve(route, href.split('#')[0] ?? '');
      expect(
        existsSync(`${target}.md`) || existsSync(path.join(target, 'index.md')),
        `${file}: ${href}`,
      ).toBe(true);
    }
  }
});

it('expands nested fields natively without synthetic type pages', () => {
  const input = readFileSync(path.join(root, 'core/interfaces/EmitterInput.md'), 'utf8');
  const config = readFileSync(path.join(root, 'core/interfaces/EmitterConfig.md'), 'utf8');
  expect(input).toContain('#### rateSpread?');
  expect(config).toContain('#### rateSpread\n');
  for (const shape of ['point', 'circle', 'box', 'cone2d']) {
    expect(input).toContain(`\`"${shape}"\``);
  }
  expect(files).not.toContain('core/interfaces/EmitterInputEmission.md');
  expect(files).not.toContain('core/interfaces/CurveInput.md');
});
