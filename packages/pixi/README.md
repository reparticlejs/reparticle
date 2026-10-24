# @reparticle/pixi

Add reparticle effects to a PixiJS v8 application using WebGL2.

```sh
npm install @reparticle/pixi
```

PixiJS must already be installed. The core engine is included.

```ts
import { ParticleEffect } from '@reparticle/pixi';

const effect = new ParticleEffect(
  {
    version: 1,
    emitters: [
      {
        id: 'sparks',
        capacity: 2048,
        seed: 42,
        emission: { rate: 120, shape: { type: 'point' } },
        initial: { lifetime: 2, speed: 90, direction: 0, spread: Math.PI * 2 },
      },
    ],
  },
  { ticker: app.ticker },
);

app.stage.addChild(effect);
```

Use your existing initialized PixiJS app. Configure it with
`preference: 'webgl'` and `preferWebGLVersion: 2`.

[Documentation and examples](https://github.com/reparticlejs/reparticle)

## License

MIT
