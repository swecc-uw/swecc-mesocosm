"use client";

import type { Episode, Run } from "@/lib/api";
import {
  episodeStatusDetail,
  formatEpisodeOutcomes,
  formatReasonList,
  reasonLabel,
  runNeedsStatusDetail,
} from "@/lib/runStatus";

interface Props {
  run: Run;
  className?: string;
}

/** Run-level terminal explanation from bench-api `status_reason` / `status_detail`. */
export function RunStatusReason({ run, className = "" }: Props) {
  if (!runNeedsStatusDetail(run.status) && !run.status_reason) return null;

  const detail = run.status_detail;
  const outcomes =
    formatEpisodeOutcomes(detail) ??
    (run.completed_count != null || run.truncated_count != null
      ? [
          run.completed_count ? `completed ${run.completed_count}` : null,
          run.truncated_count ? `truncated ${run.truncated_count}` : null,
          run.failed_count ? `failed ${run.failed_count}` : null,
          run.cancelled_count ? `cancelled ${run.cancelled_count}` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : null);

  const failureReasons =
    formatReasonList(detail, "failure_reasons") ??
    (run.failure_reasons?.length
      ? run.failure_reasons.map((r) => reasonLabel(r)).join(", ")
      : null);
  const truncationReasons =
    formatReasonList(detail, "truncation_reasons") ??
    (run.truncation_reasons?.length
      ? run.truncation_reasons.map((r) => reasonLabel(r)).join(", ")
      : null);

  if (!run.status_reason && !outcomes && !failureReasons && !truncationReasons) {
    return null;
  }

  return (
    <div className={`text-xs text-ink-2 space-y-1 ${className}`}>
      {run.status_reason && (
        <p>
          <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
            reason
          </span>
          <span className={run.status === "cancelled" ? "text-warn" : "text-bad"}>
            {reasonLabel(run.status_reason)}
          </span>
        </p>
      )}
      {outcomes && (
        <p className="num-tab">
          <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
            episodes
          </span>
          {outcomes}
        </p>
      )}
      {truncationReasons && (
        <p>
          <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
            truncated
          </span>
          {truncationReasons}
        </p>
      )}
      {failureReasons && (
        <p>
          <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
            failures
          </span>
          {failureReasons}
        </p>
      )}
      {detail?.detail && (
        <p className="num-tab text-ink-3 break-all">{String(detail.detail)}</p>
      )}
    </div>
  );
}

interface EpisodeReasonProps {
  episode: Episode;
  className?: string;
}

export function EpisodeTerminalReason({ episode, className = "" }: EpisodeReasonProps) {
  if (episode.status === "completed" || episode.status === "pending") return null;
  const text = episodeStatusDetail(episode);
  if (!text) return null;
  return (
    <p className={`text-[10px] text-ink-3 mt-0.5 ${className}`}>{text}</p>
  );
}
