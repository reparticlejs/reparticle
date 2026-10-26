import type { Property } from '../types/property';

/** Keep JSON paths in the reference; give experiments readable titles. */
export function propertyTitle(property: Property): string {
  if (property.label) {
    return property.label;
  }
  const name = property.path
    .replace(/^(initial|overLifetime|emission|artwork|rendering|effect)\./, '')
    .replaceAll('.', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2');
  return name.charAt(0).toUpperCase() + name.slice(1);
}
