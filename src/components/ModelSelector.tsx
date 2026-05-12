"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createRun,
  Domain,
  Episode,
  getRun,
  listRunEpisodes,
  Run,
  SUPPORTED_MODELS,
} from "@/lib/api";
import { Btn } from "@/components/ds/Btn";

// Display labels keyed by model id
const MODEL_LABELS: Record<string, string> = Object.fromEntries(
  SUPPORTED_MODELS.map(({ id, label }) => [id, label])
);
const AVAILABLE_MODELS = SUPPORTED_MODELS.map(({ id }) => id);

interface Props {
  domain: Domain;
}

type RunView = { run: Run; episodes: Episode[] };

interface EpSummary {
  total: number;
  completed: number;
  running: number;
  pending: number;
  failed: number;
  timeout: number;
}

function summarizeEpisodes(episodes: Episode[]): EpSummary {
  return {
    total: episodes.length,
    completed: episodes.filter((e) => e.status === "completed").length,
    running: episodes.filter((e) => e.status === "running").length,
    pending: episodes.filter((e) => e.status === "pending").length,
    failed: episodes.filter((e) => e.status === "failed").length,
    timeout: episodes.filter((e) => e.status === "timeout").length,
  };
}

const RUN_TONE: Record<string, string> = {
  completed: "text-ok",
  failed: "text-bad",
  timeout: "text-bad",
  running: "text-leaf-deep",
  pending: "text-ink-3",
};

export default function ModelSelector({ domain }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [numEpisodes, setNumEpisodes] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [runIds, setRunIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [runViews, setRunViews] = useState<Record<string, RunView>>({});
  const [monitorError, setMonitorError] = useState<string | null>(null);

  const available = AVAILABLE_MODELS.filter((m) => !selected.includes(m));
  const add = (model: string) => setSelected((s) => [...s, model]);
  const remove = (model: string) => setSelected((s) => s.filter((m) => m !== model));

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setStatus("submitting");
    setError(null);
    setMonitorError(null);
    setRunViews({});
    try {
      const runs = await Promise.all(
        selected.map((model) =>
          createRun({
            domain_id: domain.id,
            binding_vow_version: domain.binding_vow.version,
            agent_config: { model },
            num_episodes: numEpisodes,
          })
        )
      );
      setRunIds(runs.map((r) => r.id));
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
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
          })
        );
        if (!alive) return;
        const next: Record<string, RunView> = {};
        for (const [id, value] of pairs) next[id] = value;
        setRunViews(next);
        setMonitorError(null);

        const allTerminal = pairs.every(
          ([, value]) =>
            value.run.status === "completed" || value.run.status === "failed"
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

  return (
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
          onClick={handleSubmit}
          disabled={submitDisabled}
          className={submitDisabled ? "opacity-40 cursor-not-allowed" : ""}
        >
          {status === "submitting" ? "Submitting…" : "Submit benchmark"}{" "}
          <span aria-hidden>→</span>
        </Btn>
      </div>

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
        <div className="px-4 py-2 bg-paper-2 border-b border-line flex items-center justify-between">
          <span className="eyebrow">live run monitor</span>
          {sortedViews.length > 0 && (
            <span className="eyebrow">
              {sortedViews.length} run{sortedViews.length !== 1 ? "s" : ""}
            </span>
          )}
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
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium ${RUN_TONE[run.status] ?? "text-ink-3"}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {run.status}
                    </span>
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
                  </div>

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
