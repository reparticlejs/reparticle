/** Fixed scene and artwork selection; effect parameters stay in public JSON files. */
export interface Example {
  id: string;
  name: string;
  file: string;
  artwork: Record<string, { source: string; frame?: string }>;
}
