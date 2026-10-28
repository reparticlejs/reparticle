/** Shader sources are embedded as strings by the package build. */
declare module '*.glsl' {
  const source: string;
  export default source;
}

declare module '*.wgsl' {
  const source: string;
  export default source;
}
