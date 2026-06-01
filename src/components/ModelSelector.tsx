"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelRun,
  createRun,
  Domain,
  Episode,
  getRun,
  isActiveRunStatus,
  isTerminalRunStatus,
  listRunEpisodes,
  Run,
  SUPPORTED_MODELS,
} from "@/lib/api";
import { BenchAccessGate } from "@/components/BenchAccessGate";
import { Btn } from "@/components/ds/Btn";
import { RunStatusReason } from "@/components/RunStatusReason";
import { summarizeEpisodes } from "@/lib/runStatus";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { useBenchAuth } from "@/hooks/useBenchAuth";
import { getActiveTeamId } from "@/lib/benchAuth";

// Display labels keyed by model id
const MODEL_LABELS: Record<string, string> = Object.fromEntries(
  SUPPORTED_MODELS.map(({ id, label }) => [id, label])
);
const AVAILABLE_MODELS = SUPPORTED_MODELS.map(({ id }) => id);

interface Props {
  domain: Domain;
  envId?: string;
}

type RunView = { run: Run; episodes: Episode[] };

const RUN_TONE: Record<string, string> = {
  completed: "text-ok",
  failed: "text-bad",
  timeout: "text-bad",
  cancelled: "text-warn",
  truncated: "text-warn",
  running: "text-leaf-deep",
  pending: "text-ink-3",
};

export default function ModelSelector({ domain, envId }: Props) {
  const { ensureBenchForRun } = useBenchAuth();
  const { team: activeTeam } = useActiveTeam();
  const [selected, setSelected] = useState<string[]>([]);
  const [numEpisodes, setNumEpisodes] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [runIds, setRunIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [runViews, setRunViews] = useState<Record<string, RunView>>({});
  const [monitorError, setMonitorError] = useState<string | null>(null);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  const available = AVAILABLE_MODELS.filter((m) => !selected.includes(m));
  const add = (model: string) => setSelected((s) => [...s, model]);
  const remove = (model: string) => setSelected((s) => s.filter((m) => m !== model));

  const handleSubmit = async (): Promise<boolean> => {
    if (selected.length === 0) return false;
    setStatus("submitting");
    setError(null);
    setMonitorError(null);
    setRunViews({});
    try {
      const teamId = getActiveTeamId();
      const runs = await Promise.all(
        selected.map((model) =>
          createRun({
            domain_id: domain.id,
            binding_vow_version: domain.binding_vow.version,
            agent_config: { model },
            num_episodes: numEpisodes,
            ...(teamId ? { team_id: teamId } : {}),
            ...(envId ? { env_id: envId } : {}),
          })
        )
      );
      setRunIds(runs.map((r) => r.id));
      setStatus("done");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
      return false;
    }
  };

  // Poll the runs we just submitted until they all reach a terminal state.
  useEffect(() => {
    if (runIds.length === 0) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const pairs = await Promise.all(
          runIds.map(async (runId) => {
            const [run, episodes] = await Promise.all([
              getRun(runId),
              listRunEpisodes(runId),
            ]);
            return [runId, { run, episodes }] as const;
          }),
        );
        if (!alive) return;
        const next: Record<string, RunView> = {};
        for (const [id, value] of pairs) next[id] = value;
        setRunViews(next);
        setMonitorError(null);

        const allTerminal = pairs.every(([, value]) =>
          isTerminalRunStatus(value.run.status),
        );
        if (!allTerminal) timer = setTimeout(tick, 1500);
      } catch (e) {
        if (!alive) return;
        setMonitorError(e instanceof Error ? e.message : "Failed to refresh run status");
        timer = setTimeout(tick, 3000);
      }
    };

    void tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [runIds]);

  const sortedViews = useMemo(
    () =>
      Object.values(runViews).sort((a, b) =>
        a.run.created_at < b.run.created_at ? 1 : -1
      ),
    [runViews]
  );

  const submitDisabled = selected.length === 0 || status === "submitting";

  const activeRunIds = sortedViews
    .filter(({ run }) => isActiveRunStatus(run.status))
    .map(({ run }) => run.id);

  async function handleCancelRun(runId: string) {
    setCancellingIds((prev) => new Set(prev).add(runId));
    setMonitorError(null);
    try {
      const run = await cancelRun(runId);
      const episodes = await listRunEpisodes(runId);
      setRunViews((prev) => ({ ...prev, [runId]: { run, episodes } }));
    } catch (e) {
      setMonitorError(e instanceof Error ? e.message : "Failed to cancel run");
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(runId);
        return next;
      });
    }
  }

  async function handleCancelAllActive() {
    await Promise.all(activeRunIds.map((id) => handleCancelRun(id)));
  }

  async function openConfirmOrAuth() {
    if (selected.length === 0) return;
    const access = await ensureBenchForRun();
    if (access === "need_guest") return;
    setConfirmOpen(true);
  }

  return (
    <BenchAccessGate>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModelColumn
          title="available"
          empty="all models selected."
          items={available}
          onClick={add}
          actionAria="Add"
          actionGlyph="+"
        />
        <ModelColumn
          title={`selected${selected.length ? ` · ${selected.length}` : ""}`}
          empty="click models to add them."
          items={selected}
          onClick={remove}
          actionAria="Remove"
          actionGlyph="×"
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap pt-2">
        <div className="flex items-center gap-2">
          <label className="eyebrow whitespace-nowrap">episodes per model</label>
          <input
            type="number"
            min={1}
            max={20}
            value={numEpisodes}
            onChange={(e) =>
              setNumEpisodes(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="w-16 px-2 h-8 text-sm border border-line bg-paper text-ink text-center rounded-[2px] focus:outline-none focus:border-ink num-tab"
          />
        </div>

        <Btn
          variant="primary"
          onClick={() => void openConfirmOrAuth()}
          disabled={submitDisabled}
          className={submitDisabled ? "opacity-40 cursor-not-allowed" : ""}
        >
          Submit benchmark <span aria-hidden>→</span>
        </Btn>
      </div>

      {confirmOpen && (
        <BenchmarkSubmitModal
          domain={domain}
          models={selected}
          numEpisodes={numEpisodes}
          activeTeam={activeTeam}
          loading={status === "submitting"}
          onClose={() => {
            if (status !== "submitting") setConfirmOpen(false);
          }}
          onConfirm={async () => {
            const ok = await handleSubmit();
            if (ok) setConfirmOpen(false);
          }}
        />
      )}

      {status === "done" && (
        <div className="border border-line rounded-[2px] px-4 py-3 bg-leaf-tint">
          <p className="text-sm text-ink font-medium">
            {runIds.length} run{runIds.length !== 1 ? "s" : ""} submitted.
          </p>
          <p className="text-xs text-ink-2 num-tab mt-1 break-all">
            {runIds.join(", ")}
          </p>
          <p className="text-xs text-ink-2 mt-1">
            Monitoring status below. Runs become leaderboard entries once they
            complete.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="border border-line rounded-[2px] px-4 py-3 bg-paper-2">
          <p className="text-sm text-bad font-medium">Submission failed.</p>
          <p className="text-xs text-ink-2 num-tab mt-1">{error}</p>
        </div>
      )}

      {monitorError && (
        <div className="border border-line rounded-[2px] px-4 py-3 bg-paper-2">
          <p className="text-sm text-warn font-medium">Run monitor warning</p>
          <p className="text-xs text-ink-2 num-tab mt-1">{monitorError}</p>
        </div>
      )}

      <div className="border border-line rounded-[2px] bg-paper overflow-hidden">
        <div className="px-4 py-2 bg-paper-2 border-b border-line flex items-center justify-between gap-3 flex-wrap">
          <span className="eyebrow">live run monitor</span>
          <div className="flex items-center gap-3">
            {activeRunIds.length > 0 && (
              <Btn
                variant="link"
                onClick={() => void handleCancelAllActive()}
                disabled={cancellingIds.size > 0}
                className="text-xs uppercase tracking-[0.14em]"
              >
                Stop all ({activeRunIds.length})
              </Btn>
            )}
            {sortedViews.length > 0 && (
              <span className="eyebrow">
                {sortedViews.length} run{sortedViews.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {sortedViews.length === 0 ? (
          <div className="px-4 py-8 text-center [font-family:var(--f-display)] italic text-ink-3 text-base">
            no active run yet — submit one above.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {sortedViews.map(({ run, episodes }) => {
              const s = summarizeEpisodes(episodes);
              const model = String(run.config.agent_config.model ?? "unknown");
              return (
                <div key={run.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-sm text-ink num-tab truncate">{MODEL_LABELS[model] ?? model}</span>
                      <span className="text-xs text-ink-3 num-tab truncate">
                        run · {run.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isActiveRunStatus(run.status) && (
                        <Btn
                          variant="link"
                          onClick={() => void handleCancelRun(run.id)}
                          disabled={cancellingIds.has(run.id)}
                          className="text-[10px] uppercase tracking-[0.14em] px-0 h-auto text-warn hover:text-bad"
                        >
                          {cancellingIds.has(run.id) ? "Stopping…" : "Stop run"}
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

                  <div className="text-xs text-ink-2 num-tab flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>
                      <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">eps</span>
                      {s.total}
                    </span>
                    <span>
                      <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">done</span>
                      {s.completed}
                    </span>
                    {s.running > 0 && (
                      <span className="text-leaf-deep">
                        <span className="uppercase tracking-[0.12em] text-[10px] mr-1">running</span>
                        {s.running}
                      </span>
                    )}
                    {s.pending > 0 && (
                      <span>
                        <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">pending</span>
                        {s.pending}
                      </span>
                    )}
                    {s.failed > 0 && (
                      <span className="text-bad">
                        <span className="uppercase tracking-[0.12em] text-[10px] mr-1">failed</span>
                        {s.failed}
                      </span>
                    )}
                    {s.timeout > 0 && (
                      <span className="text-bad">
                        <span className="uppercase tracking-[0.12em] text-[10px] mr-1">timeout</span>
                        {s.timeout}
                      </span>
                    )}
                    {s.truncated > 0 && (
                      <span className="text-warn">
                        <span className="uppercase tracking-[0.12em] text-[10px] mr-1">truncated</span>
                        {s.truncated}
                      </span>
                    )}
                    {s.cancelled > 0 && (
                      <span className="text-warn">
                        <span className="uppercase tracking-[0.12em] text-[10px] mr-1">cancelled</span>
                        {s.cancelled}
                      </span>
                    )}
                  </div>

                  <RunStatusReason run={run} />

                  {run.status === "completed" &&
                    Object.keys(run.scores ?? {}).length > 0 && (
                      <div className="text-xs num-tab text-ink bg-paper-2 border border-line rounded-[2px] px-3 py-2 overflow-x-auto">
                        {Object.entries(run.scores).map(([k, v]) => (
                          <span key={k} className="mr-4 inline-block">
                            <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] mr-1">{k}</span>
                            <span className="num-old text-base">
                              {typeof v === "number" ? v.toFixed(3) : String(v)}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </BenchAccessGate>
  );
}

function BenchmarkSubmitModal({
  domain,
  models,
  numEpisodes,
  activeTeam,
  loading,
  onClose,
  onConfirm,
}: {
  domain: Domain;
  models: string[];
  numEpisodes: number;
  activeTeam: { id: string; name: string } | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [loading, onClose]);

  const totalEpisodes = models.length * numEpisodes;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="benchmark-confirm-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-md border border-line rounded-[2px] bg-paper shadow-lg">
        <div className="px-6 py-4 border-b border-line">
          <span className="eyebrow">— confirm benchmark</span>
          <h2
            id="benchmark-confirm-title"
            className="mt-2 text-xl font-medium text-ink [font-family:var(--f-display)]"
            style={{ letterSpacing: "-0.012em" }}
          >
            Submit {models.length} run{models.length !== 1 ? "s" : ""}?
          </h2>
          <p className="mt-2 text-sm text-ink-2 leading-relaxed">
            Review attribution and settings before starting episodes on{" "}
            <strong className="text-ink">{domain.name}</strong>.
          </p>
        </div>

        <div className="px-6 py-4 space-y-3 text-sm">
          <ConfirmRow label="Domain" value={domain.name} />
          <ConfirmRow label="Binding vow" value={`v${domain.binding_vow.version}`} />
          <ConfirmRow
            label="Credited to"
            value={activeTeam ? `Team · ${activeTeam.name}` : "You (solo)"}
            highlight={!!activeTeam}
          />
          <div>
            <p className="eyebrow mb-2">Models</p>
            <ul className="border border-line rounded-[2px] divide-y divide-line bg-paper-2">
              {models.map((m) => (
                <li key={m} className="px-3 py-2 text-ink num-tab">
                  {MODEL_LABELS[m] ?? m}
                </li>
              ))}
            </ul>
          </div>
          <ConfirmRow
            label="Episodes"
            value={`${numEpisodes} per model · ${totalEpisodes} total`}
          />
          <p className="text-xs text-ink-3 leading-relaxed pt-1">
            Runs start immediately after you confirm. Change solo vs team on your{" "}
            <Link to="/account#teams" className="text-leaf-deep underline underline-offset-2">
              account
            </Link>{" "}
            page.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <Btn variant="link" onClick={onClose} disabled={loading}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            onClick={() => void onConfirm()}
            disabled={loading}
            className={loading ? "opacity-40 cursor-not-allowed" : ""}
          >
            {loading ? "Submitting…" : "Confirm & submit"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function ConfirmRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 py-2 border-b border-line last:border-0 ${
        highlight ? "bg-paper-2 -mx-2 px-2 rounded-[2px]" : ""
      }`}
    >
      <span className="text-ink-3 uppercase tracking-[0.12em] text-[10px] shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-ink text-right font-medium">{value}</span>
    </div>
  );
}

function ModelColumn({
  title,
  empty,
  items,
  onClick,
  actionAria,
  actionGlyph,
}: {
  title: string;
  empty: string;
  items: string[];
  onClick: (m: string) => void;
  actionAria: string;
  actionGlyph: string;
}) {
  return (
    <div className="border border-line rounded-[2px] overflow-hidden bg-paper">
      <div className="px-4 py-2 bg-paper-2 border-b border-line">
        <p className="eyebrow">{title}</p>
      </div>
      <ul className="divide-y divide-line">
        {items.length === 0 && (
          <li className="px-4 py-5 text-center [font-family:var(--f-display)] italic text-ink-3 text-base">
            {empty}
          </li>
        )}
        {items.map((m) => (
          <li
            key={m}
            onClick={() => onClick(m)}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-paper-2 transition-colors cursor-pointer group"
          >
            <span className="text-sm text-ink num-tab">{MODEL_LABELS[m] ?? m}</span>
            <span
              aria-label={`${actionAria} ${m}`}
              className="text-ink-3 group-hover:text-leaf-deep transition-colors text-base leading-none"
            >
              {actionGlyph}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
