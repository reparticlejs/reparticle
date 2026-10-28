/** WebGPU resources borrowed from the host renderer. */
export interface EmitterContext {
  device: GPUDevice;
  assertAvailable?: (() => void) | undefined;
}
