/** WebGPU's standard flags, kept local so importing core does not require browser globals. */
export const GPUTextureUsage = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  STORAGE_BINDING: 8,
} as const;
export const GPUBufferUsage = { COPY_DST: 8, UNIFORM: 64 } as const;
export const GPUShaderStage = { COMPUTE: 4 } as const;
