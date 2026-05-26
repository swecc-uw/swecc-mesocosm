import type { Episode, Run } from "@/lib/api";

/** GET /v1/runs/{id}/export — showcase replay bundle. */
export interface RunExport {
  schema_version: string;
  exported_at: string;
  visibility?: string | null;
  domain_id: string;
  domain_name?: string | null;
  binding_vow_version: string;
  run: Run;
  episodes: Episode[];
  traces: Record<string, TraceEventJson[]>;
  replay: Record<string, ReplayTurn[]>;
}

export interface TraceEventJson {
  episode_id: string;
  step: number;
  timestamp: string;
  event_type: string;
  payload: Record<string, unknown>;
}

export interface ReplayTurn {
  step: number;
  timestamp?: string;
  observation?: unknown;
  board_before?: unknown;
  board_after?: unknown;
  env_message?: string;
  reasoning?: string;
  model?: string;
  action?: unknown;
  reward?: number;
  terminated?: boolean;
  truncated?: boolean;
  info?: Record<string, string>;
  env_system_prompt?: string;
  episode_end?: Record<string, unknown>;
}
