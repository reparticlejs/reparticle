import type { createPixiApp } from '../create-pixi-app';

export type PixiApp = NonNullable<Awaited<ReturnType<typeof createPixiApp>>>;
