/** GLSL files are embedded as strings by the package build after resolving shared includes. */
declare module '*.glsl' {
  const source: string;
  export default source;
}
