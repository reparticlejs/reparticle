declare module "gpu.js/dist/gpu-browser.js" {
  const GPU: new (options: Record<string, unknown>) => {
    createKernel(source: string, settings: Record<string, unknown>): unknown;
  };
  export default GPU;
}
