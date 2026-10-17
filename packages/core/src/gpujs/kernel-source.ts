/** Escape minified JavaScript identifiers that GLSL cannot represent.
 * These internal kernels contain only numeric expressions, not strings.
 * Escaping underscores too keeps distinct identifiers distinct.
 */
export function kernelSource(source: { toString(): string }): string {
  return source.toString().replaceAll('_', '_underscore_').replaceAll('$', '_dollar_');
}
