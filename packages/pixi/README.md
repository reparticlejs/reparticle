# @reparticle/pixi

Add reparticle effects to a PixiJS v8 application using WebGL2 or WebGPU.

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

Requires PixiJS v8.22.0 or later within v8.

### TypeScript 6 and 7

If your compiler reports missing WebGPU types, install the complete DOM declarations:

```sh
npm install --save-dev @typescript/lib-dom@npm:@types/web
```

TypeScript uses these in place of its built-in DOM declarations. Keep `DOM` in
your `lib` settings and remove `@webgpu/types` from `compilerOptions.types` if present.

[Documentation and examples](https://github.com/reparticlejs/reparticle)

## Renderer selection

Import reparticle before initializing your Pixi application. The default entry point
loads the backend selected by Pixi during `app.init()`:

```ts
import { ParticleEffect } from '@reparticle/pixi';
```

For an app that uses only one backend, choose its explicit import instead:

```ts
import { ParticleEffect } from '@reparticle/pixi/webgl2';
// Or, for a WebGPU application:
import { ParticleEffect } from '@reparticle/pixi/webgpu';
```

Explicit imports include only that backend. Use the same backend in Pixi's
`app.init()` options (`preference: 'webgl'` with `preferWebGLVersion: 2`, or
`preference: 'webgpu'`). A mismatched renderer reports an error. Effect JSON,
textures, and playback methods stay the same.

The automatic entry follows Pixi's final renderer choice, including Pixi's fallback
from WebGPU to WebGL. It does not switch a running effect between renderers.

## License

MIT
