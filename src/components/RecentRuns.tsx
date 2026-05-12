"use client";

import { useCallback, useEffect, useState } from "react";
import { Episode, listRunEpisodes, listRuns, Run } from "@/lib/api";

interface Props {
  domainId: string;
}

type RunWithEpisodes = { run: Run; episodes: Episode[] };

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
  running: "text-leaf-deep",
  pending: "text-ink-3",
};

const EP_DOT: Record<string, string> = {
  completed: "bg-ok",
  failed: "bg-bad",
  timeout: "bg-bad",
  running: "bg-leaf-deep animate-pulse",
  pending: "bg-ink-3",
};

export default function RecentRuns({ domainId }: Props) {
  const [runs, setRuns] = useState<RunWithEpisodes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchRuns = useCallback(async () => {
    try {
      const all = await listRuns(domainId);
      const sorted = all.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const withEpisodes = await Promise.all(
        sorted.slice(0, 20).map(async (run) => {
          try {
            const episodes = await listRunEpisodes(run.id);
            return { run, episodes };
          } catch {
            return { run, episodes: [] };
          }
        }),
      );
      setRuns(withEpisodes);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  }, [domainId]);

  useEffect(() => {
    queueMicrotask(() => void fetchRuns());
    const interval = setInterval(() => void fetchRuns(), 5000);
    return () => clearInterval(interval);
  }, [fetchRuns]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
      <div className="px-4 py-2 bg-paper-2 border-b border-line flex items-center justify-between">
        <span className="eyebrow">recent runs</span>
        <span className="eyebrow">
          {runs.length} run{runs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {runs.length === 0 ? (
        <div className="px-4 py-10 text-center [font-family:var(--f-display)] italic text-ink-3 text-base">
          no runs yet — submit one below or via the API.
        </div>
      ) : (
        <div className="divide-y divide-line max-h-[480px] overflow-y-auto">
          {runs.map(({ run, episodes }) => {
            const model = run.config.agent_config.model ?? "unknown";
            const isExpanded = expanded.has(run.id);
            const completedEps = episodes.filter((e) => e.status === "completed");
            const failedEps = episodes.filter((e) => e.status === "failed");
            const totalReward = completedEps.reduce((s, e) => s + e.total_reward, 0);
            const avgReward =
              completedEps.length > 0 ? totalReward / completedEps.length : 0;

            return (
              <div key={run.id}>
                <button
                  onClick={() => toggle(run.id)}
                  className="w-full text-left px-4 py-3 hover:bg-paper-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-block transition-transform text-ink-3 text-xs ${isExpanded ? "rotate-90" : ""}`}
                      >
                        ▸
                      </span>
                      <span className="text-sm text-ink num-tab truncate">
                        {model}
                      </span>
                      <span className="text-xs text-ink-3">
                        {relativeTime(run.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-ink-2 num-tab">
                        {completedEps.length}/{episodes.length} ep
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium ${RUN_TONE[run.status] ?? "text-ink-3"}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {run.status}
                      </span>
                    </div>
                  </div>

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

                    {completedEps.length > 0 && (
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

                    <div className="pl-5 space-y-1">
                      {episodes.map((ep) => (
                        <div
                          key={ep.id}
                          className="flex items-center justify-between text-xs bg-paper-2 border border-line rounded-[2px] px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${EP_DOT[ep.status] ?? "bg-ink-3"}`}
                            />
                            <span className="text-ink-2 num-tab">
                              {ep.id.slice(0, 8)}
                            </span>
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

                    {failedEps.length > 0 && Boolean(failedEps[0].terminal_info?.error) && (
                      <div className="pl-5 mt-1">
                        <details className="text-xs">
                          <summary className="text-bad cursor-pointer uppercase tracking-[0.16em] text-[10px] font-medium">
                            error details
                          </summary>
                          <pre
                            className="mt-2 p-2 border border-line rounded-[2px] bg-paper-2 text-bad overflow-x-auto whitespace-pre-wrap text-[10px] leading-relaxed max-h-32 overflow-y-auto num-tab"
                            style={{ fontFamily: "var(--f-mono)" }}
                          >
                            {String(failedEps[0].terminal_info.error)}
                          </pre>
                        </details>
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
