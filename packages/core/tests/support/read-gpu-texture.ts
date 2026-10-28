/** Readback is test-only. Rendering uses these textures directly without CPU copies. */
export async function readGPU(device: GPUDevice, texture: GPUTexture) {
  const rowBytes = Math.ceil((texture.width * 16) / 256) * 256;
  const buffer = device.createBuffer({ size: rowBytes * texture.height, usage: 1 | 8 });
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer({ texture }, { buffer, bytesPerRow: rowBytes }, [
    texture.width,
    texture.height,
  ]);
  device.queue.submit([encoder.finish()]);
  await buffer.mapAsync(1);
  const data = new Float32Array(buffer.getMappedRange());
  const result: number[] = [];
  for (let row = 0; row < texture.height; row++) {
    result.push(...data.subarray((row * rowBytes) / 4, (row * rowBytes) / 4 + texture.width * 4));
  }
  buffer.unmap();
  buffer.destroy();
  return result;
}
