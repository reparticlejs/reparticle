// An explicit WebGPU run must fail clearly, never fall back or silently skip.
const adapter = await navigator.gpu?.requestAdapter();
if (!adapter) {
  throw new Error(
    'WebGPU tests require a working browser GPU adapter. Run pnpm test for unit and WebGL2 tests, or enable WebGPU on this machine and rerun pnpm test:webgpu.',
  );
}

export {};
