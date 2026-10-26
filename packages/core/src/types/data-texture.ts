/** CPU upload storage and dimensions for a simulation data texture. */
export interface DataTexture {
  texture: WebGLTexture;
  data: Float32Array<ArrayBuffer>;
  width: number;
  height: number;
  uploaded?: boolean;
}
