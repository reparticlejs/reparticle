import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Application } from 'typedoc';

const site = fileURLToPath(new URL('../', import.meta.url));
const packages = ['core', 'pixi'];

// TypeDoc owns type resolution, Markdown generation, and output cleanup.
// Once generated, each page only needs Astro metadata and browser-facing links.
for (const name of packages) {
  const source = path.resolve(site, '../../packages', name);
  const output = path.join(site, 'src/content/api', name);
  const app = await Application.bootstrapWithPlugins({
    options: path.join(site, 'typedoc.json'),
    entryPoints: [path.join(source, 'src/index.ts')],
    name: `@reparticle/${name}`,
    out: output,
  });
  const project = await app.convert();
  if (!project) {
    throw new Error(`Unable to generate @reparticle/${name} API`);
  }
  await app.generateOutputs(project);

  const files = await readdir(output, { recursive: true });
  for (const file of files.filter((entry) => entry.endsWith('.md'))) {
    const declaration = project.children?.find(
      (child) => child.name === path.basename(file, '.md'),
    );
    const summary = declaration?.comment?.summary.map((part) => part.text).join('');
    await adaptAstroPage(path.join(output, file), name, summary);
  }
}

/** Astro uses frontmatter for page titles and navigation; the API route owns the layout. */
async function adaptAstroPage(file: string, packageName: string, summary?: string): Promise<void> {
  const markdown = await readFile(file, 'utf8');
  const pageName = path.basename(file, '.md');
  const title = pageName === 'index' ? `@reparticle/${packageName}` : pageName;
  const metadata = {
    title,
    description: summary || `Source-generated API for ${title} in @reparticle/${packageName}.`,
    package: packageName,
  };
  // JSON-quoted values are valid YAML and safely preserve punctuation in titles.
  const frontmatter = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
  const content = rewritePageLinks(markdown, file);
  await writeFile(file, `---\n${frontmatter}\n---\n\n${content}`);
}

/**
 * TypeDoc links to Markdown files; Astro serves directory URLs instead.
 * For example, classes/Emitter.md becomes classes/Emitter/, while index.md
 * becomes its parent directory. Resolve both ends before making links relative
 * so nested pages and sites hosted under a URL prefix work the same way.
 * External links and heading fragments are preserved.
 */
function rewritePageLinks(markdown: string, file: string): string {
  const currentPage = file.replace(/(?:\/index)?\.md$/, '');
  return markdown.replace(
    /\]\(([^)\s]+\.md)(#[^)\s]*)?\)/g,
    (match, target: string, fragment: string = '') => {
      if (/^(https?:|\/\/)/.test(target)) {
        return match;
      }
      const targetFile = path.resolve(path.dirname(file), target);
      const targetPage = targetFile.replace(/(?:\/index)?\.md$/, '');
      const relativePath = path.relative(currentPage, targetPage) || '.';
      return `](${relativePath}/${fragment})`;
    },
  );
}
