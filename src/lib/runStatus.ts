import type { Episode, Run, RunStatusDetail } from "@/lib/api";

/** Stable codes from bench-api `status_reason` / episode `terminal_info.reason`. */
export const REASON_LABELS: Record<string, string> = {
  user_cancelled: "Cancelled by user",
  task_cancelled: "Run task cancelled",
  domain_missing: "Domain no longer exists",
  no_episodes: "No episodes recorded",
  insufficient_scoreable_episodes: "Too few episodes finished successfully",
  execute_run_error: "Run execution error",
  stale_run_timeout: "Run timed out (stale)",
  bench_api_restart: "Interrupted by platform restart",
  manual_reap: "Marked failed by operator",
  stale_orphan: "Stranded run cleaned up",
  unknown_failure: "Run failed (reason unknown)",
  run_cancelled: "Cancelled while running",
  episode_error: "Episode error",
  no_env_url: "No environment URL configured",
  step_limit: "Step limit reached",
  wall_time_limit: "Wall-clock time limit reached",
  token_budget_exceeded: "Token budget exceeded",
};

export function reasonLabel(code: string | null | undefined): string {
  if (!code) return "Unknown";
  return REASON_LABELS[code] ?? code.replace(/_/g, " ");
}

export function episodeTerminalReason(episode: Episode): string | null {
  const info = episode.terminal_info ?? {};
  const reason = info.reason;
  if (typeof reason === "string" && reason) return reason;
  if (episode.status === "failed" && info.error) return "episode_error";
  return null;
}

export function episodeStatusDetail(episode: Episode): string | null {
  const info = episode.terminal_info ?? {};
  const reason = episodeTerminalReason(episode);
  const parts: string[] = [];
  if (reason) parts.push(reasonLabel(reason));
  if (typeof info.error === "string" && info.error) parts.push(info.error);
  if (reason === "step_limit" && info.max_steps != null) {
    parts.push(`max_steps=${String(info.max_steps)}`);
  }
  if (info.detail != null && info.detail !== "") {
    parts.push(String(info.detail));
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function runNeedsStatusDetail(status: Run["status"]): boolean {
  return status === "failed" || status === "cancelled";
}

export function formatEpisodeOutcomes(detail: RunStatusDetail | undefined): string | null {
  const outcomes = detail?.episode_outcomes;
  if (!outcomes) return null;
  const parts = Object.entries(outcomes)
    .filter(([, n]) => typeof n === "number" && n > 0)
    .map(([k, n]) => `${k} ${n}`);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function formatReasonList(
  detail: RunStatusDetail | undefined,
  key: "failure_reasons" | "truncation_reasons" | "cancellation_reasons",
): string | null {
  const vals = detail?.[key];
  if (!Array.isArray(vals) || vals.length === 0) return null;
  return vals.map((v) => reasonLabel(String(v))).join(", ");
}

export interface EpisodeCounts {
  total: number;
  completed: number;
  running: number;
  pending: number;
  failed: number;
  timeout: number;
  truncated: number;
  cancelled: number;
}

export function summarizeEpisodes(episodes: Episode[]): EpisodeCounts {
  return {
    total: episodes.length,
    completed: episodes.filter((e) => e.status === "completed").length,
    running: episodes.filter((e) => e.status === "running").length,
    pending: episodes.filter((e) => e.status === "pending").length,
    failed: episodes.filter((e) => e.status === "failed").length,
    timeout: episodes.filter((e) => e.status === "timeout").length,
    truncated: episodes.filter((e) => e.status === "truncated").length,
    cancelled: episodes.filter((e) => e.status === "cancelled").length,
  };
}
