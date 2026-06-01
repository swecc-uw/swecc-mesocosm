"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cancelRun,
  Episode,
  isActiveRunStatus,
  listGalleryRuns,
  listRunEpisodes,
  listRuns,
  Run,
} from "@/lib/api";
import { Btn } from "@/components/ds/Btn";
import type { GalleryRunEntry } from "@/types/bench";
import { useBenchAuth } from "@/hooks/useBenchAuth";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { ScopePill } from "@/components/ScopePill";
import ExpandableErrorText from "@/components/ExpandableErrorText";
import { EpisodeTerminalReason, RunStatusReason } from "@/components/RunStatusReason";
import { RunVisibilityButton } from "@/components/RunVisibilityButton";
import { benchAuthDisabled } from "@/lib/env";

interface Props {
  domainId: string;
}

const DISPLAY_LIMIT = 20;
const POLL_ACTIVE_MS = 5000;
const POLL_IDLE_MS = 30000;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const RUN_TONE: Record<string, string> = {
  completed: "text-ok",
  failed: "text-bad",
  timeout: "text-bad",
  cancelled: "text-warn",
  truncated: "text-warn",
  running: "text-leaf-deep",
  pending: "text-ink-3",
};

const EP_DOT: Record<string, string> = {
  completed: "bg-ok",
  failed: "bg-bad",
  timeout: "bg-bad",
  cancelled: "bg-warn",
  truncated: "bg-warn",
  running: "bg-leaf-deep animate-pulse",
  pending: "bg-ink-3",
};

/** Gallery list entries are a subset of Run — synthesize for unified recent-activity UI. */
function runFromGalleryEntry(entry: GalleryRunEntry, bindingVersion: string): Run {
  const scores: Record<string, number> = {};
  if (entry.primary_score != null) {
    scores.win_rate = entry.primary_score;
  }
  return {
    id: entry.run_id,
    config: {
      domain_id: entry.domain_id,
      binding_vow_version: bindingVersion,
      agent_config: { model: entry.model },
      num_episodes: 1,
    },
    requester_id: "gallery",
    status: "completed",
    created_at: entry.created_at,
    scores,
  };
}

export default function RecentRuns({
  domainId,
  envId,
  bindingVowVersion = "1.0.0",
}: Props & { bindingVowVersion?: string; envId?: string }) {
  const { benchMe, refreshBench } = useBenchAuth();
  const { team: activeTeam } = useActiveTeam();
  const [runs, setRuns] = useState<Run[]>([]);
  const [episodesByRunId, setEpisodesByRunId] = useState<Record<string, Episode[]>>({});
  const [loadingEpisodes, setLoadingEpisodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const initialLoad = useRef(true);
  const expandedRef = useRef(expanded);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  const canManageRuns =
    !benchAuthDisabled() && (benchMe.type === "member" || benchMe.type === "guest");

  function handleRunVisibilityUpdated(updated: Run) {
    setRuns((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  }

  const loadEpisodes = useCallback(async (runId: string) => {
    setLoadingEpisodes((prev) => new Set(prev).add(runId));
    try {
      const episodes = await listRunEpisodes(runId);
      setEpisodesByRunId((prev) => ({ ...prev, [runId]: episodes }));
    } catch {
      setEpisodesByRunId((prev) => ({ ...prev, [runId]: [] }));
    } finally {
      setLoadingEpisodes((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  }, []);

  async function handleCancelRun(runId: string) {
    setCancellingIds((prev) => new Set(prev).add(runId));
    try {
      await cancelRun(runId);
      await fetchRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel run");
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  }

  const fetchRuns = useCallback(async () => {
    if (!initialLoad.current) setRefreshing(true);
    try {
      if (!benchAuthDisabled() && benchMe.type === "anonymous") {
        await refreshBench();
      }

      const [apiRuns, gallery] = await Promise.all([
        listRuns({ domainId, envId, limit: DISPLAY_LIMIT }).catch(() => [] as Run[]),
        listGalleryRuns(domainId, DISPLAY_LIMIT).catch(() => [] as GalleryRunEntry[]),
      ]);

      const byId = new Map<string, Run>();
      for (const run of apiRuns) {
        byId.set(run.id, run);
      }
      for (const entry of gallery) {
        if (!byId.has(entry.run_id)) {
          byId.set(entry.run_id, runFromGalleryEntry(entry, bindingVowVersion));
        }
      }

      const sorted = [...byId.values()]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, DISPLAY_LIMIT);

      setRuns(sorted);
      setError(null);
      setLastRefresh(new Date());

      const refreshEpisodeIds = sorted
        .filter(
          (run) =>
            expandedRef.current.has(run.id) && isActiveRunStatus(run.status),
        )
        .map((run) => run.id);
      if (refreshEpisodeIds.length > 0) {
        await Promise.all(refreshEpisodeIds.map((id) => loadEpisodes(id)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load runs");
    } finally {
      setLoading(false);
      setRefreshing(false);
      initialLoad.current = false;
    }
  }, [domainId, envId, bindingVowVersion, benchMe.type, refreshBench, loadEpisodes]);

  const hasActiveRuns = runs.some((run) => isActiveRunStatus(run.status));
  const pollMs = hasActiveRuns ? POLL_ACTIVE_MS : POLL_IDLE_MS;

  useEffect(() => {
    const boot = window.setTimeout(() => void fetchRuns(), 0);
    const interval = setInterval(() => void fetchRuns(), pollMs);
    return () => {
      window.clearTimeout(boot);
      clearInterval(interval);
    };
  }, [fetchRuns, pollMs]);

  const toggle = (id: string) => {
    const willExpand = !expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (willExpand) next.add(id);
      else next.delete(id);
      return next;
    });
    if (willExpand && !episodesByRunId[id] && !loadingEpisodes.has(id)) {
      void loadEpisodes(id);
    }
  };

  const scopeHint =
    benchMe.type === "member"
      ? activeTeam
        ? `Your runs for ${activeTeam.name} on this domain, plus public gallery entries. Solo vs team is shown on each row.`
        : "Your solo runs on this domain plus public gallery entries. Switch to a team on Account to bench as a group."
      : benchMe.type === "guest"
        ? "Runs from your guest session and public gallery."
        : "Public gallery runs only — sign in to see your private runs.";

  if (loading) {
    return (
      <div className="border border-line rounded-[2px] bg-paper-2 px-5 py-6">
        <div className="eyebrow">loading recent runs…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-line rounded-[2px] bg-paper-2 px-4 py-3">
        <p className="text-sm text-warn font-medium">Could not load runs</p>
        <p className="text-xs text-ink-2 num-tab mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-[2px] bg-paper overflow-hidden">
      <div className="px-4 py-2 bg-paper-2 border-b border-line flex items-center justify-between gap-3 flex-wrap">
        <span className="eyebrow">recent runs</span>
        <div className="flex items-center gap-3 text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${refreshing ? "bg-leaf-deep animate-pulse" : "bg-ok"}`}
            />
            {refreshing
              ? "refreshing…"
              : lastRefresh
                ? `updated ${relativeTime(lastRefresh.toISOString())}`
                : "live"}
          </span>
          <span className="eyebrow">
            {runs.length} run{runs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <p className="px-4 py-2 text-[11px] text-ink-3 border-b border-line bg-paper-2">
        {scopeHint}{" "}
        {hasActiveRuns
          ? `Polls every ${POLL_ACTIVE_MS / 1000}s while runs are active.`
          : `Polls every ${POLL_IDLE_MS / 1000}s.`}{" "}
        Expand a row to load episode details.
      </p>

      {runs.length === 0 ? (
        <div className="px-4 py-10 text-center [font-family:var(--f-display)] italic text-ink-3 text-base">
          no runs yet — submit one below or via the API.
        </div>
      ) : (
        <div
          className={
            runs.length > 5
              ? "divide-y divide-line max-h-[17.5rem] overflow-y-auto overscroll-y-contain"
              : "divide-y divide-line"
          }
        >
          {runs.map((run) => {
            const model = run.config.agent_config.model ?? "unknown";
            const isExpanded = expanded.has(run.id);
            const episodes = episodesByRunId[run.id];
            const episodesLoading = loadingEpisodes.has(run.id);
            const completedEps = episodes?.filter((e) => e.status === "completed") ?? [];
            const failedEps =
              episodes?.filter((e) =>
                ["failed", "timeout", "cancelled", "truncated"].includes(e.status),
              ) ?? [];
            const totalReward = completedEps.reduce((s, e) => s + e.total_reward, 0);
            const avgReward =
              completedEps.length > 0 ? totalReward / completedEps.length : 0;
            const epSummary = episodes
              ? `${completedEps.length}/${episodes.length} ep`
              : `${run.config.num_episodes} ep`;

            return (
              <div key={run.id}>
                <button
                  type="button"
                  onClick={() => toggle(run.id)}
                  className="w-full text-left px-4 py-3 hover:bg-paper-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span
                        className={`inline-block transition-transform text-ink-3 text-xs ${isExpanded ? "rotate-90" : ""}`}
                      >
                        ▸
                      </span>
                      {run.requester_id !== "gallery" && (
                        <ScopePill
                          teamId={run.team_id}
                          teamName={
                            run.team_id && activeTeam?.id === run.team_id
                              ? activeTeam.name
                              : run.team_id
                                ? "Team"
                                : null
                          }
                        />
                      )}
                      <span className="text-sm text-ink num-tab truncate">
                        {model}
                      </span>
                      <span className="text-xs text-ink-3">
                        {relativeTime(run.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-ink-2 num-tab">{epSummary}</span>
                      <RunVisibilityButton
                        run={run}
                        galleryEntry={run.requester_id === "gallery"}
                        onUpdated={handleRunVisibilityUpdated}
                      />
                      {canManageRuns &&
                        run.requester_id !== "gallery" &&
                        isActiveRunStatus(run.status) && (
                          <Btn
                            variant="link"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleCancelRun(run.id);
                            }}
                            disabled={cancellingIds.has(run.id)}
                            className="text-[10px] uppercase tracking-[0.14em] px-0 h-auto text-warn hover:text-bad"
                          >
                            {cancellingIds.has(run.id) ? "Stopping…" : "Stop"}
                          </Btn>
                        )}
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium ${RUN_TONE[run.status] ?? "text-ink-3"}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {run.status}
                      </span>
                    </div>
                  </div>

                  {(run.status === "failed" || run.status === "cancelled") && (
                    <RunStatusReason run={run} className="mt-2 pl-5" />
                  )}

                  {run.status === "completed" &&
                    Object.keys(run.scores ?? {}).length > 0 && (
                      <div className="mt-2 pl-5 flex flex-wrap gap-x-4 gap-y-1">
                        {Object.entries(run.scores).map(([k, v]) => (
                          <span key={k} className="text-xs num-tab">
                            <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
                              {k}
                            </span>
                            <span className="num-old text-base text-ink">
                              {typeof v === "number" ? v.toFixed(3) : String(v)}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2">
                    <div className="text-xs text-ink-3 num-tab pl-5">
                      run · {run.id}
                    </div>

                    {episodesLoading && (
                      <p className="pl-5 text-xs text-ink-3">loading episodes…</p>
                    )}

                    {!episodesLoading && episodes && completedEps.length > 0 && (
                      <div className="pl-5 text-xs text-ink-2 flex gap-4">
                        <span>
                          <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
                            avg reward
                          </span>
                          <span className="num-old text-base text-ink">
                            {avgReward.toFixed(3)}
                          </span>
                        </span>
                        <span>
                          <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
                            avg steps
                          </span>
                          <span className="num-old text-base text-ink">
                            {(
                              completedEps.reduce((s, e) => s + e.steps, 0) /
                              completedEps.length
                            ).toFixed(0)}
                          </span>
                        </span>
                      </div>
                    )}

                    {!episodesLoading && episodes && episodes.length > 0 && (
                      <div className="pl-5 space-y-1">
                        {episodes.map((ep) => (
                          <div
                            key={ep.id}
                            className="flex items-center justify-between text-xs bg-paper-2 border border-line rounded-[2px] px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${EP_DOT[ep.status] ?? "bg-ink-3"}`}
                              />
                              <div className="min-w-0">
                                <span className="text-ink-2 num-tab block">
                                  {ep.id.slice(0, 8)}
                                </span>
                                <EpisodeTerminalReason episode={ep} />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-ink-2 num-tab">
                              <span>
                                <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
                                  steps
                                </span>
                                {ep.steps}
                              </span>
                              <span>
                                <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
                                  reward
                                </span>
                                <span className="num-old text-base text-ink">
                                  {ep.total_reward.toFixed(2)}
                                </span>
                              </span>
                              {ep.terminal_info?.max_tile != null && (
                                <span>
                                  <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">
                                    max tile
                                  </span>
                                  <span>{String(ep.terminal_info.max_tile)}</span>
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] font-medium ${RUN_TONE[ep.status] ?? "text-ink-3"}`}
                              >
                                {ep.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!episodesLoading &&
                      episodes &&
                      failedEps.length > 0 &&
                      failedEps.some((ep) => ep.terminal_info?.error) && (
                        <div className="pl-5 mt-1 space-y-2">
                          {failedEps
                            .filter((ep) => ep.terminal_info?.error)
                            .slice(0, 3)
                            .map((ep) => (
                              <details key={ep.id} className="text-xs">
                                <summary className="text-bad cursor-pointer uppercase tracking-[0.16em] text-[10px] font-medium">
                                  {ep.status} · {ep.id.slice(0, 8)}
                                </summary>
                                <ExpandableErrorText
                                  className="mt-2"
                                  text={String(ep.terminal_info.error)}
                                />
                              </details>
                            ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
