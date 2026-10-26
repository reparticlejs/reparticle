import type { ComponentProps } from 'astro/types';

import type ApiLayout from '../layouts/api.astro';

// Content has no runtime layout imports; Astro supplies its parsed metadata.
const pages = import.meta.glob<ComponentProps<typeof ApiLayout>['frontmatter']>(
  './api/{core,pixi}/**/*.md',
  { import: 'frontmatter', eager: true },
);

export const apiPages = Object.entries(pages)
  .map(([file, metadata]) => ({
    path: `${file.replace('./', '').replace(/(?:\/index)?\.md$/, '')}/`,
    title: metadata.title,
    description: metadata.description,
    package: metadata.package,
    kind: file.split('/')[3],
  }))
  .sort((a, b) => a.title.localeCompare(b.title));

const kinds = [
  ['classes', 'Classes'],
  ['functions', 'Functions'],
  ['interfaces', 'Interfaces'],
  ['types', 'Types'],
  ['variables', 'Variables'],
];

export const apiPackages = ['core', 'pixi'].map((name) => ({
  name,
  title: `@reparticle/${name}`,
  path: `api/${name}/`,
  groups: kinds
    .map(([kind, title]) => ({
      title,
      links: apiPages.filter((page) => page.package === name && page.kind === kind),
    }))
    .filter((group) => group.links.length > 0),
}));

// Search uses the same package catalog as the sidebar.
export const apiNavigation = [
  { title: 'Reference', links: [{ path: 'api/', title: 'Overview' }] },
  ...apiPackages.map((pkg) => ({
    title: pkg.title,
    links: apiPages.filter((page) => page.package === pkg.name),
  })),
];
