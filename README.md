# reparticle

**A GPU particle engine with JSON-defined effects.** reparticle handles particle behavior and simulation; PixiJS is its first and primary renderer, and the only renderer currently available.

The core uses GPU.js for simulation and has no PixiJS dependency. The PixiJS integration renders directly from its GPU textures and provides the `ParticleEffect` display object. It creates no sprite per particle and does not read particle state back to the CPU. Particle concepts and behavior are inspired by [Defold](https://defold.com/).

For an existing PixiJS v8 app, install `@reparticle/pixi`. The core engine is included.

```sh
npm install @reparticle/pixi
```

## Try the examples

Requires **Node.js 24+** and **pnpm 10.32.1**.

```sh
git clone https://github.com/reparticlejs/reparticle.git
cd reparticle
pnpm install
pnpm dev
```

Open the URL printed by Vite. Choose an effect, pause it, or restart it. The gallery includes fire, smoke, water, sparks, animated coins, explosions, and a 500,000-particle snowstorm. Live particle count and FPS appear over the canvas.

For mobile testing, open Vite's Network URL on a device connected to the same network. Performance depends on the device, particle capacity, texture size, and screen coverage.

## Use with PixiJS

`ParticleEffect` is a Pixi display object. Add it to the stage or another container; no renderer argument is needed.

```ts
import { ParticleEffect, type EffectInput } from '@reparticle/pixi';
import { Application } from 'pixi.js';

const app = new Application();
await app.init({
  resizeTo: window,
  preference: 'webgl',
  preferWebGLVersion: 2,
  background: '#111111',
});
document.body.appendChild(app.canvas);

const definition = {
  version: 1,
  emitters: [
    {
      id: 'sparks',
      capacity: 2048,
      seed: 1,
      emission: { rate: 500, shape: { type: 'point' } },
      initial: {
        lifetime: 2,
        speed: 180,
        direction: -Math.PI / 2,
        spread: Math.PI / 3,
        size: 6,
      },
      rendering: { blendMode: 'add' },
    },
  ],
} satisfies EffectInput;

const effect = new ParticleEffect(definition, { ticker: app.ticker });
effect.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(effect);
```

Omitted artwork uses soft procedural particles. GPU resources initialize on the first render, and automatic updates run on the supplied ticker. Call `effect.destroy()` when removing an effect permanently; shared textures remain owned by the caller.

### Textures and animation

Artwork is separate from effect JSON and is bound by emitter ID:

```ts
import { Assets } from 'pixi.js';

const spark = await Assets.load('/assets/spark.png');
const effect = new ParticleEffect(definition, {
  ticker: app.ticker,
  emitters: {
    sparks: { textures: [spark] },
  },
});
```

A single texture is static. Multiple frames enable flipbook animation and must share the same atlas texture source. Use `validateAnimationFrames` to validate a loaded frame array before passing it with `playback` and `fps` settings. Artwork bindings also support sizing, pivot, and horizontal or vertical flips.

### Runtime controls

```ts
effect.autoUpdate = false; // Pause simulation.
effect.autoUpdate = true; // Resume.
effect.reset(); // Restart the effect.

effect.getEmitter('sparks').setParameters({
  emission: { rate: 800 },
  initial: { speed: 240 },
});
```

For a custom loop, construct with `autoUpdate: false` and call `effect.update(seconds)` after the first render initializes it. Manual steps must be between 0 and 0.1 seconds. Automatic updates split longer ticker deltas into bounded steps.

## What is supported

- Multiple emitters, point/circle/box/2D cone shapes, local or world emission space, and inherited emitter velocity.
- Once or looping playback, delays, prewarm, spread, lifecycle events, and runtime parameter changes.
- Curves for emission and initial properties over emitter lifetime; size, color, alpha, rotation, angular velocity, and stretch over particle lifetime.
- Acceleration, drag, radial, and vortex modifiers, including shared effect modifiers and repeated modifier types.
- Pixi transforms, tint, blend modes, atlas frames, flipbooks, filters, masks, and render textures.

Effect configuration is validated by core. Consumers supply data and supported parameter updates; arbitrary custom GPU functions are not part of the public API.

Browse the [effect definitions](examples/demo/public/effects), [artwork bindings](examples/demo/src/examples/effects), or [configuration skeleton](docs/effect.example.json) for complete examples.

## Packages

| Package            | Responsibility                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `@reparticle/core` | Configuration validation, emission scheduling, particle allocation, and GPU.js simulation. No Pixi dependency. |
| `@reparticle/pixi` | The `ParticleEffect` display object, artwork bindings, and rendering through PixiJS 8.                         |
| `examples/demo`    | The React example gallery, sharing one Pixi application across effects.                                        |

CPU bookkeeping handles births, expiration, and live counts. Particle state stays in GPU textures shared with the renderer. GPU functions are authored in TypeScript and packaged as source strings during the library build; GPU.js compiles them on the device. Consumers need no custom build plugin or minifier configuration.

## Requirements and limits

- **WebGL2 with `EXT_color_buffer_float`** is required. There is no CPU fallback or WebGPU backend.
- **Capacity is explicit.** When full, an emitter keeps living particles and drops excess births. Simulation and drawing costs depend on capacity, not only the live count; choose it to fit the effect.
- **Particles draw in fixed slot order.** There is no per-particle depth or lifetime sorting; emitters draw in definition order.
- **Bounds are not calculated automatically.** Supply bounds, hit areas, or filter areas when your use requires them.
- **An effect belongs to one renderer.** Moving live simulation between WebGL contexts and context-loss recovery are not supported.
- **GPU.js adds runtime compilation and bundle cost.** There is no editor included.

## Development

```sh
pnpm check   # Formatting, lint, typecheck, tests, and production builds.
pnpm format  # Format the workspace.
pnpm build   # Build the packages and demo.
```

The demo imports built packages. `pnpm dev` builds them before starting Vite; rebuild after library changes, or run each library's `tsdown --watch` in a separate terminal.

Example artwork attribution and full license texts are linked from the [demo README](examples/demo/README.md).

## Website

Run `pnpm dev:site` for the Astro homepage and live examples gallery. The site reuses
the demo player, effects, and artwork. See [site development](examples/site/README.md).

## License

[MIT](LICENSE). Example artwork has its own licenses listed in the [demo README](examples/demo/README.md).
