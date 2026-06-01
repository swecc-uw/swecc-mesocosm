"use client";

import { BenchJob, Episode, SUPPORTED_MODELS } from "@/lib/api";
import ExpandableErrorText from "@/components/ExpandableErrorText";
import { episodeStatusDetail } from "@/lib/runStatus";

const MODEL_LABELS: Record<string, string> = Object.fromEntries(
  SUPPORTED_MODELS.map(({ id, label }) => [id, label])
);

const STATUS_STYLE: Record<string, string> = {
  completed: "text-ok",
  failed:    "text-bad",
  running:   "text-leaf-deep",
  queued:    "text-ink-3",
  timeout:   "text-bad",
  truncated: "text-warn",
  cancelled: "text-warn",
};

function Metric({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex flex-col items-center border border-line rounded-[2px] bg-paper-2 px-3 py-2">
      <span className="num-old text-lg text-ink leading-none">
        {value === null || value === undefined ? "—" : value}
      </span>
      <span className="eyebrow mt-1">{label}</span>
    </div>
  );
}

interface TestBenchResultProps {
  episode: Episode;
}

export function TestBenchResult({ episode }: TestBenchResultProps) {
  return (
    <div className="border border-line rounded-[2px] bg-paper p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">test bench result</span>
        <span className={`text-[10px] uppercase tracking-[0.16em] font-medium ${STATUS_STYLE[episode.status] ?? "text-ink-3"}`}>
          {episode.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Metric label="reward" value={episode.total_reward.toFixed(3)} />
        <Metric label="steps" value={episode.steps} />
        <Metric label="status" value={episode.status} />
      </div>
      {(episode.status === "failed" ||
        episode.status === "timeout" ||
        episode.status === "truncated" ||
        episode.status === "cancelled") && (
        <div className="mt-3">
          {episodeStatusDetail(episode) && (
            <p className="text-xs text-ink-2 mb-2">{episodeStatusDetail(episode)}</p>
          )}
          {episode.terminal_info?.error != null && (
            <>
              <p className="eyebrow text-bad mb-1">error</p>
              <ExpandableErrorText
                className="text-xs"
                text={String(episode.terminal_info.error)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface FullBenchResultProps {
  job: BenchJob;
}

export function FullBenchResult({ job }: FullBenchResultProps) {
  const models = SUPPORTED_MODELS.map(({ id }) => id);
  const results = job.model_results ?? {};

  return (
    <div className="border border-line rounded-[2px] bg-paper p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">full bench</span>
        <span className={`text-[10px] uppercase tracking-[0.16em] font-medium ${STATUS_STYLE[job.status] ?? "text-ink-3"}`}>
          {job.status}
        </span>
      </div>
      <div className="space-y-1.5">
        {models.map((modelId) => {
          const r = results[modelId];
          const score = r?.primary_score != null ? r.primary_score.toFixed(3) : null;
          const modelStatus = r?.status ?? (job.status === "running" ? "queued" : "—");
          return (
            <div
              key={modelId}
              className="flex items-center justify-between px-3 py-2 bg-paper-2 border border-line rounded-[2px] text-xs"
            >
              <span className="text-ink num-tab">{MODEL_LABELS[modelId] ?? modelId}</span>
              <div className="flex items-center gap-3">
                {score !== null && (
                  <span className="num-old text-ink">{score}</span>
                )}
                <span className={`uppercase tracking-[0.12em] text-[10px] ${STATUS_STYLE[modelStatus] ?? "text-ink-3"}`}>
                  {modelStatus}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
