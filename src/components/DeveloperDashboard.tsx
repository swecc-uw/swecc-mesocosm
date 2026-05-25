"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BenchJob,
  deleteEnvironment,
  DeveloperEnvironment,
  DomainUsageStats,
  Episode,
  getBenchJobs,
  getDevBenchStatus,
  pollEnvStatus,
  retryEnvironment,
  startFullBench,
  submitDeveloperEnvironment,
  testBench,
  SUPPORTED_MODELS,
} from "@/lib/api";
import { Btn } from "@/components/ds/Btn";
import { FullBenchResult, TestBenchResult } from "@/components/BenchResultPanel";
import { getActiveTeamId } from "@/lib/benchAuth";
import { SubmittingAsBanner } from "@/components/SubmittingAsBanner";
import { SubmitViaApiPanel } from "@/components/SubmitViaApiPanel";

const STATUS_TONE: Record<string, { label: string; tone: string }> = {
  pending:  { label: "pending",  tone: "text-ink-3" },
  cloning:  { label: "cloning",  tone: "text-warn" },
  ready:    { label: "ready",    tone: "text-ok" },
  failed:   { label: "failed",   tone: "text-bad" },
};

function StatusBadge({ status }: { status: string }) {
  const { label, tone } = STATUS_TONE[status] ?? STATUS_TONE.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium">
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${tone}`} />
      <span className={tone}>{label}</span>
    </span>
  );
}

function StatPanel({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="border border-line rounded-[2px] bg-paper p-5">
      <p className="num-old text-4xl text-ink leading-none">{value}</p>
      <p className="eyebrow mt-2">{label}</p>
    </div>
  );
}

function UsagePill({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="border border-line rounded-[2px] bg-paper-2 px-3 py-2 flex flex-col items-center justify-center">
      <span className="num-old text-lg text-ink leading-none">
        {value === null || value === undefined ? "—" : value}
      </span>
      <span className="eyebrow mt-1.5">{label}</span>
    </div>
  );
}

// ── Test bench modal (one platform-wide slot; see bench-api /v1/bench/status) ───

function TestBenchModal({
  open,
  envId,
  envName,
  devBenchBusy,
  onClose,
}: {
  open: boolean;
  envId: string;
  envName: string;
  devBenchBusy: boolean;
  onClose: () => void;
}) {
  const [model, setModel] = useState(SUPPORTED_MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Episode | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const ep = await testBench({ env_id: envId, model, num_episodes: 1 });
      setResult(ep);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bench failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-bench-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-lg max-h-[min(90vh,640px)] overflow-y-auto border border-line rounded-[2px] bg-paper shadow-lg">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-paper px-6 py-4">
          <div className="min-w-0">
            <span className="eyebrow eyebrow-leaf">— test bench</span>
            <h2
              id="test-bench-title"
              className="mt-2 text-xl font-medium text-ink [font-family:var(--f-display)] truncate"
              style={{ letterSpacing: "-0.012em" }}
            >
              {envName}
            </h2>
            <p className="mt-1 text-xs text-ink-2 leading-relaxed">
              One model, one episode. The dev test bench is shared across all users — only one run
              at a time on the server.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-ink-3 hover:text-ink text-2xl leading-none shrink-0 disabled:opacity-40"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {devBenchBusy && !loading && !result && (
            <p className="text-sm text-warn border border-line rounded-[2px] px-3 py-2 bg-paper-2">
              Another test bench is running platform-wide. Try again in a moment.
            </p>
          )}

          {!result ? (
            <>
              <label className="block">
                <span className="eyebrow mb-1.5 block">Model</span>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loading || devBenchBusy}
                  className="w-full px-3 py-2 text-sm bg-paper-2 border border-line rounded-[2px] focus:outline-none focus:border-ink disabled:opacity-50"
                >
                  {SUPPORTED_MODELS.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {error && (
                <p className="text-sm text-bad border border-line rounded-[2px] px-3 py-2 bg-paper-2">
                  {error}
                </p>
              )}
            </>
          ) : (
            <TestBenchResult episode={result} />
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-line bg-paper px-6 py-4">
          {result ? (
            <Btn variant="primary" onClick={onClose}>
              Done
            </Btn>
          ) : (
            <>
              <Btn variant="link" onClick={onClose} disabled={loading}>
                Cancel
              </Btn>
              <Btn
                variant="primary"
                onClick={() => void handleRun()}
                disabled={loading || devBenchBusy}
                className={loading || devBenchBusy ? "opacity-40 cursor-not-allowed" : ""}
              >
                {loading ? "Running…" : "Run test →"}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Environment card ───────────────────────────────────────────────────────────

function EnvironmentCard({
  env,
  usage,
  devBenchBusy,
  onEnvUpdate,
  onEnvDelete,
}: {
  env: DeveloperEnvironment;
  usage?: DomainUsageStats;
  devBenchBusy: boolean;
  onEnvUpdate: (updated: DeveloperEnvironment) => void;
  onEnvDelete: (id: string) => void;
}) {
  const [testBenchOpen, setTestBenchOpen] = useState(false);
  const [fullBenchJob, setFullBenchJob] = useState<BenchJob | null>(null);
  const [fullBenchError, setFullBenchError] = useState<string | null>(null);
  const [confirmFull, setConfirmFull] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorExpanded, setErrorExpanded] = useState(false);

  const created = new Date(env.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const avgScore = usage?.avg_score != null ? usage.avg_score.toFixed(3) : null;
  const bestScore = usage?.best_score != null ? usage.best_score.toFixed(3) : null;
  const canRetry = env.status === "failed" || env.status === "pending";

  async function handleRetry() {
    setRetrying(true);
    try {
      const updated = await retryEnvironment(env.id);
      onEnvUpdate(updated);
    } catch {
      // error will show up on the updated env
    } finally {
      setRetrying(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEnvironment(env.id);
      onEnvDelete(env.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleFullBench() {
    setFullBenchError(null);
    try {
      const job = await startFullBench(env.id);
      setFullBenchJob(job);
      setConfirmFull(false);
    } catch (err) {
      setFullBenchError(err instanceof Error ? err.message : "Full bench failed to start");
      setConfirmFull(false);
    }
  }

  // Poll full bench job until terminal
  useEffect(() => {
    if (!fullBenchJob || fullBenchJob.status === "completed" || fullBenchJob.status === "failed") return;
    let alive = true;
    const interval = setInterval(async () => {
      try {
        const jobs = await getBenchJobs(env.id);
        const updated = jobs.find((j) => j.id === fullBenchJob.id);
        if (updated && alive) setFullBenchJob(updated);
        if (updated?.status === "completed" || updated?.status === "failed") clearInterval(interval);
      } catch { /* ignore */ }
    }, 3000);
    return () => { alive = false; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- poll keyed by job id/status only
  }, [fullBenchJob?.id, fullBenchJob?.status, env.id]);

  return (
    <article className="border border-line rounded-[2px] bg-paper p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-medium text-ink truncate [font-family:var(--f-display)]" style={{ letterSpacing: "-0.012em" }}>
            {env.name}
          </h3>
          {env.description && (
            <p className="text-sm text-ink-2 mt-0.5 line-clamp-2 leading-relaxed">
              {env.description}
            </p>
          )}
        </div>
        <StatusBadge status={env.status} />
      </div>

      {/* Provenance — github link when cloned from a repo, "via API / MCP"
          badge when the row was mirrored from a direct POST /v1/domains call
          (bench-api sets github_url="" for that case). */}
      {env.github_url ? (
        <a
          href={env.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-leaf-deep transition-colors truncate max-w-full mb-4 num-tab"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          {env.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
        </a>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-ink-3 mb-4 px-2 py-0.5 border border-line rounded-[2px] bg-paper-2">
          registered via API / MCP
        </span>
      )}

      {/* Error message — expandable to show full stderr */}
      {env.error_message && (
        <div className="mb-4 border border-line rounded-[2px] bg-paper-2 overflow-hidden">
          <button
            onClick={() => setErrorExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-paper transition-colors"
          >
            <span className="text-xs text-bad font-medium">
              {errorExpanded ? "▾" : "▸"} {env.error_message.split("\n")[0]}
            </span>
            {env.error_message.includes("\n") && (
              <span className="text-[10px] text-ink-3 uppercase tracking-[0.14em]">
                {errorExpanded ? "collapse" : "show logs"}
              </span>
            )}
          </button>
          {errorExpanded && env.error_message.includes("\n") && (
            <pre className="px-3 pb-3 text-[11px] text-ink-2 overflow-x-auto leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "var(--f-mono)" }}>
              {env.error_message.split("\n").slice(1).join("\n")}
            </pre>
          )}
        </div>
      )}

      {/* Usage stats */}
      <div className="grid grid-cols-4 gap-2">
        <UsagePill label="runs" value={usage?.total_runs ?? 0} />
        <UsagePill label="episodes" value={usage?.total_episodes ?? 0} />
        <UsagePill label="avg" value={avgScore} />
        <UsagePill label="best" value={bestScore} />
      </div>

      {/* Action row */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        {env.status === "ready" && env.domain_id && (
          <Link
            to={`/domains/${env.domain_id}`}
            className="text-xs text-ink-2 hover:text-leaf-deep transition-colors uppercase tracking-[0.14em]"
          >
            View domain →
          </Link>
        )}

        {env.status === "ready" && (
          <>
            <Btn
              variant="link"
              onClick={() => setTestBenchOpen(true)}
              disabled={devBenchBusy}
              className={devBenchBusy ? "opacity-40 cursor-not-allowed" : ""}
              title={
                devBenchBusy
                  ? "Another user's test bench is using the shared slot"
                  : undefined
              }
            >
              Test bench →
            </Btn>
            {testBenchOpen ? (
              <TestBenchModal
                key={env.id}
                open
                envId={env.id}
                envName={env.name}
                devBenchBusy={devBenchBusy}
                onClose={() => setTestBenchOpen(false)}
              />
            ) : null}
            {!confirmFull ? (
              <Btn variant="link" onClick={() => setConfirmFull(true)}>Full bench →</Btn>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-2">Run all 5 models?</span>
                <Btn variant="primary" onClick={handleFullBench}>Confirm →</Btn>
                <Btn variant="link" onClick={() => setConfirmFull(false)}>Cancel</Btn>
              </div>
            )}
          </>
        )}

        {canRetry && (
          <Btn
            variant="link"
            onClick={handleRetry}
            disabled={retrying}
            className={retrying ? "opacity-40 cursor-not-allowed" : ""}
          >
            {retrying ? "Retrying…" : "Retry →"}
          </Btn>
        )}

        {/* Delete */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto text-[10px] uppercase tracking-[0.14em] text-ink-3 hover:text-bad transition-colors"
          >
            Delete
          </button>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-ink-2">Remove this env?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[10px] uppercase tracking-[0.14em] text-bad hover:text-bad/70 transition-colors disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] uppercase tracking-[0.14em] text-ink-3 hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {fullBenchError && <p className="mt-2 text-xs text-bad">{fullBenchError}</p>}
      {fullBenchJob && <FullBenchResult job={fullBenchJob} />}

      <p className="eyebrow mt-3">submitted · {created}</p>
    </article>
  );
}

// ── Submit form ────────────────────────────────────────────────────────────────

function SubmitForm({
  onSubmit,
}: {
  onSubmit: (env: DeveloperEnvironment) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    github_url: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const teamId = getActiveTeamId();
      const env = await submitDeveloperEnvironment({
        ...form,
        ...(teamId ? { team_id: teamId } : {}),
      });
      onSubmit(env);
      setOpen(false);
      setForm({ name: "", description: "", github_url: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Btn variant="primary" onClick={() => setOpen(true)}>
        <span className="leading-none">+</span>
        Submit environment <span aria-hidden>→</span>
      </Btn>
    );
  }

  return (
    <div className="border border-line rounded-[2px] bg-paper p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-medium text-ink [font-family:var(--f-display)]" style={{ letterSpacing: "-0.012em" }}>
          Submit a <em>new</em> environment.
        </h2>
        <button onClick={() => setOpen(false)} className="text-ink-3 hover:text-ink transition-colors text-xl leading-none" aria-label="Close">×</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SubmittingAsBanner compact />
        <FormInput label="environment name" required value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="my coding bench" />
        <FormInput
          label="github repository url"
          required
          type="url"
          value={form.github_url}
          onChange={(v) => setForm((f) => ({ ...f, github_url: v }))}
          placeholder="https://github.com/your-org/your-env"
          help="Repository must contain a benchanything.json at its root."
        />
        <div>
          <label className="eyebrow mb-1.5 block">description <span className="opacity-60">(optional)</span></label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What does this environment evaluate?"
            className="w-full px-3 py-2 text-sm bg-paper-2 border border-line rounded-[2px] focus:outline-none focus:border-ink transition-colors resize-none placeholder:text-ink-3"
          />
        </div>
        {error && <div className="px-3 py-2 border border-line rounded-[2px] bg-paper-2 text-xs text-bad">{error}</div>}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Btn variant="link" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn variant="primary" type="submit" disabled={loading} className={loading ? "opacity-40 cursor-not-allowed" : ""}>
            {loading ? "Submitting…" : "Submit"} <span aria-hidden>→</span>
          </Btn>
        </div>
      </form>
    </div>
  );
}

function FormInput({ label, required, type = "text", value, onChange, placeholder, help }: {
  label: string; required?: boolean; type?: string;
  value: string; onChange: (v: string) => void; placeholder?: string; help?: string;
}) {
  return (
    <div>
      <label className="eyebrow mb-1.5 block">{label}</label>
      <input
        required={required} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-paper-2 border border-line rounded-[2px] focus:outline-none focus:border-ink transition-colors placeholder:text-ink-3 num-tab"
      />
      {help && <p className="mt-1 text-xs text-ink-3">{help}</p>}
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

interface DeveloperDashboardProps {
  initialEnvs: DeveloperEnvironment[];
}

export default function DeveloperDashboard({ initialEnvs }: DeveloperDashboardProps) {
  const [envs, setEnvs] = useState<DeveloperEnvironment[]>(initialEnvs);
  const [filterName, setFilterName] = useState("");
  const [devBenchBusy, setDevBenchBusy] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleNewEnv(env: DeveloperEnvironment) {
    setEnvs((prev) => [env, ...prev]);
  }

  function handleEnvUpdate(updated: DeveloperEnvironment) {
    setEnvs((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  function handleEnvDelete(id: string) {
    setEnvs((prev) => prev.filter((e) => e.id !== id));
  }

  // Poll status for any envs that are still processing
  useEffect(() => {
    const needsPolling = () => envs.some((e) => e.status === "pending" || e.status === "cloning");

    if (!needsPolling()) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    if (pollingRef.current) return; // already polling

    pollingRef.current = setInterval(async () => {
      const targets = envs.filter((e) => e.status === "pending" || e.status === "cloning");
      if (targets.length === 0) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        return;
      }
      await Promise.all(
        targets.map(async (env) => {
          try {
            const poll = await pollEnvStatus(env.id);
            if (poll.status !== env.status || poll.domain_id !== env.domain_id) {
              setEnvs((prev) =>
                prev.map((e) =>
                  e.id === env.id ? { ...e, ...poll } : e
                )
              );
            }
          } catch {
            // transient — ignore
          }
        })
      );
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [envs]);

  // Poll dev bench busy state
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { busy } = await getDevBenchStatus();
        setDevBenchBusy(busy);
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const displayed = filterName.trim()
    ? envs.filter((e) => e.name.toLowerCase().includes(filterName.trim().toLowerCase()))
    : envs;

  const total = envs.length;
  const readyCount = envs.filter((e) => e.status === "ready").length;
  const pendingCount = envs.filter((e) => e.status === "pending" || e.status === "cloning").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12 max-w-2xl">
        <span className="eyebrow eyebrow-leaf">— developer registry</span>
        <h1 className="mt-3 text-5xl font-medium text-ink leading-tight [font-family:var(--f-display)]" style={{ letterSpacing: "-0.018em" }}>
          Publish your <em>environment.</em>
        </h1>
        <p className="mt-4 text-lg text-ink-2 leading-relaxed">
          Submit a GitHub repository with a <code className="text-sm font-mono bg-paper-2 px-1 rounded">benchanything.json</code>; we clone, validate, and admit it to the archive. Anyone can then bench against it.
        </p>
      </header>

      <div className="mb-6">
        <SubmittingAsBanner />
      </div>

      {devBenchBusy && (
        <div className="mb-6 px-4 py-3 border border-line rounded-[2px] bg-paper-2 flex items-center gap-2 text-xs text-warn leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse shrink-0" />
          A dev test bench is running somewhere on the platform (shared slot — not per-user).
          New runs wait until it finishes.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatPanel value={total} label="environments submitted" />
        <StatPanel value={readyCount} label="ready to benchmark" />
        <StatPanel value={pendingCount} label="pending · processing" />
      </div>

      <SubmitForm onSubmit={handleNewEnv} />

      <div className="mb-10 grid grid-cols-2 gap-6">
        <div className="border border-line rounded-[2px] bg-paper-2 p-5">
          <h3 className="text-lg font-medium text-ink [font-family:var(--f-display)]" style={{ letterSpacing: "-0.012em" }}>
            Via the <em>web form.</em>
          </h3>
          <p className="text-sm text-ink-2 mt-2 mb-4 leading-relaxed">
            Use the submit button above to fill out a short form with your GitHub link and metadata.
          </p>
          <span className="inline-flex items-center px-2.5 h-6 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium bg-leaf-tint text-leaf-deep">
            recommended
          </span>
        </div>
        <div className="border border-line rounded-[2px] bg-paper-2 p-5">
          <h3 className="text-lg font-medium text-ink [font-family:var(--f-display)]" style={{ letterSpacing: "-0.012em" }}>
            Via <em>CLI.</em>
          </h3>
          <p className="text-sm text-ink-2 mt-2 leading-relaxed">
            Install the <code className="text-xs font-mono bg-paper px-1 rounded">bench</code> CLI
            with <code className="text-xs font-mono bg-paper px-1 rounded">pip install swecc-mesocosm</code>{" "}
            for CI or your terminal — production URLs are built in. Requires{" "}
            <code className="text-xs font-mono bg-paper px-1 rounded">benchanything.json</code> at
            repo root.
          </p>
        </div>
      </div>

      <section className="mb-12 border border-line rounded-[2px] bg-paper p-6">
        <h2 className="eyebrow mb-4">Submit via CLI</h2>
        <SubmitViaApiPanel />
      </section>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-medium text-ink [font-family:var(--f-display)]" style={{ letterSpacing: "-0.012em" }}>
          Submitted <em>environments.</em>
        </h2>
        <input
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          placeholder="filter by name…"
          className="px-3 h-8 text-sm bg-paper border border-line rounded-full focus:outline-none focus:border-ink transition-colors w-52 placeholder:text-ink-3"
        />
      </div>

      {displayed.length === 0 ? (
        <div className="border border-line rounded-[2px] bg-paper-2 py-20 text-center">
          <p className="[font-family:var(--f-display)] italic text-2xl text-ink-2">
            {envs.length === 0 ? "no environments yet." : "no environments match this filter."}
          </p>
          <p className="mt-2 text-sm text-ink-3 max-w-sm mx-auto">
            {envs.length === 0
              ? "Submit your first environment via the button above or the API."
              : "Try a different name filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayed.map((env) => (
            <EnvironmentCard
              key={env.id}
              env={env}
              devBenchBusy={devBenchBusy}
              onEnvUpdate={handleEnvUpdate}
              onEnvDelete={handleEnvDelete}
            />
          ))}
        </div>
      )}

      {displayed.length > 0 && (
        <p className="eyebrow mt-6 text-center">
          showing {displayed.length} of {envs.length} environment{envs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
