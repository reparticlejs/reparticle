/** Shared section navigation for the documentation and reference pages. */
export const documentation = [
  {
    title: 'Getting started',
    links: [
      {
        path: 'docs/introduction/',
        title: 'Introduction',
        description:
          'Meet the engine, its two packages, and the requirements for running GPU particles.',
      },
      {
        path: 'docs/quick-start/',
        title: 'Quick start',
        description: 'Create an effect, bind its artwork, and add particles to your Pixi stage.',
      },
    ],
  },
  {
    title: 'Working with effects',
    links: [
      {
        path: 'docs/configuration/',
        title: 'Configuration guide',
        description: 'Understand effect fields, defaults, and their live experiments.',
      },
      {
        path: 'docs/textures/',
        title: 'Pixi textures & animation',
        description: 'Bind artwork and configure flipbooks in the Pixi integration.',
      },
      {
        path: 'docs/concepts/',
        title: 'How effects work',
        description:
          'Understand emitters, coordinate spaces, playback, and the simulation lifecycle.',
      },
      {
        path: 'docs/curves/',
        title: 'Curves',
        description:
          'Shape properties over time and understand the clocks and units behind each value.',
      },
    ],
  },
  {
    title: 'Contributing',
    links: [
      {
        path: 'docs/development/',
        title: 'Development',
        description: 'Set up the repository, run the site and examples, and check your changes.',
      },
      {
        path: 'docs/development/architecture/',
        title: 'Particle architecture',
        description: 'Understand shader generation, particle storage, and resource ownership.',
      },
    ],
  },
];

export { apiNavigation as reference } from './api';
