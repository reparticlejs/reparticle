import type { BackendSelectProps } from '../types/backend-select-props';

/** Native select supports keyboard and touch without custom menu behavior. */
export function BackendSelect({ value, onChange }: BackendSelectProps) {
  return (
    <label className="backend-select">
      <span>Renderer</span>
      <select
        value={value}
        onChange={(event) => {
          const backend = event.currentTarget.value;
          if (backend === 'auto' || backend === 'webgl2' || backend === 'webgpu') {
            onChange(backend);
          }
        }}
      >
        <option value="auto">Auto</option>
        <option value="webgl2">WebGL2</option>
        <option value="webgpu">WebGPU</option>
      </select>
    </label>
  );
}
