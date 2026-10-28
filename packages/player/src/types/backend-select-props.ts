import type { PlayerBackend } from './player-backend';

export interface BackendSelectProps {
  value: PlayerBackend;
  onChange: (backend: PlayerBackend) => void;
}
