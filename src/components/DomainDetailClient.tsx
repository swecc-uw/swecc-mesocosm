"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Domain,
  LeaderboardEntry,
  domainScoring,
  publishDomain,
  unpublishDomain,
} from "@/lib/api";
import { API_BASE } from "@/lib/env";
import { Sigil } from "@/components/ds/Sigil";
import TagBadge from "./TagBadge";
import BenchEnvToggle, { Mode } from "./BenchEnvToggle";
import Leaderboard from "./Leaderboard";
import ModelSelector from "./ModelSelector";
import RecentRuns from "./RecentRuns";
import VersionHistory from "./VersionHistory";
import { BenchAccessGate } from "@/components/BenchAccessGate";
import { useBenchAuth } from "@/hooks/useBenchAuth";
import { benchAuthDisabled } from "@/lib/env";

interface Props {
  domain: Domain;
  leaderboard: LeaderboardEntry[];
  envId?: string;
}

const TIER_ROMAN: Record<string, string> = { tier1: "i.", tier2: "ii." };

export default function DomainDetailClient({
  domain: initialDomain,
  leaderboard,
  envId,
}: Props) {
  const { benchMe } = useBenchAuth();
  const [domain, setDomain] = useState<Domain>(initialDomain);
  const [mode, setMode] = useState<Mode>("bench");
  const isDomainOwner =
    benchAuthDisabled() ||
    (benchMe.type === "member" &&
      benchMe.user_id != null &&
      String(benchMe.user_id) === domain.owner_id);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      const updated = await publishDomain(domain.id);
      setDomain(updated);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setUnpublishing(true);
    setPublishError(null);
    try {
      const updated = await unpublishDomain(domain.id);
      setDomain(updated);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to unpublish");
    } finally {
      setUnpublishing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto min-w-0 px-4 sm:px-6 py-10 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          to="/"
          className="text-sm text-ink-2 hover:text-ink transition-colors inline-flex items-center gap-1.5"
        >
          <span aria-hidden>←</span> The gallery
        </Link>
      </nav>

      {/* Header */}
      <header className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 pb-8 border-b border-line">
        <div className="bg-vellum border border-line rounded-[2px] flex items-center justify-center py-8 px-6">
          <Sigil id={domain.id} size={96} />
        </div>

        <div>
          <span className="eyebrow eyebrow-leaf">
            entry · {TIER_ROMAN[domain.binding_vow.tier] ?? "i."} {domain.owner_id}
          </span>

          <h1
            className="mt-3 text-5xl font-medium text-ink leading-tight [font-family:var(--f-display)]"
            style={{ letterSpacing: "-0.018em" }}
          >
            {domain.name}
          </h1>

          {domain.detail && (
            <p className="mt-4 text-lg text-ink-2 leading-relaxed max-w-prose">
              {domain.detail}
            </p>
          )}

          {/* Metadata chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 h-6 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium border border-line text-ink-2 num-tab">
              v{domain.binding_vow.version}
            </span>
            <span className="inline-flex items-center px-2.5 h-6 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium bg-leaf-tint text-leaf-deep">
              {domain.binding_vow.tier}
            </span>
            <span className="inline-flex items-center px-2.5 h-6 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium border border-line text-ink-2">
              {domain.endpoint.mode}
            </span>
            {domain.has_gold_benchmark && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium border"
                style={{
                  color: "oklch(0.55 0.13 80)",
                  borderColor: "oklch(0.78 0.13 80)",
                  background: "oklch(0.97 0.04 80)",
                }}
              >
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: "oklch(0.65 0.16 80)" }}
                />
                gold benchmark
              </span>
            )}
            {domain.status !== "published" && (
              <span className="inline-flex items-center px-2.5 h-6 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium bg-paper-3 text-ink-3">
                {domain.status}
              </span>
            )}
            {isDomainOwner && (
              <BenchAccessGate membersOnly>
                {domain.status === "draft" && (
                  <button
                    onClick={handlePublish}
                    disabled={publishing || unpublishing}
                    className="inline-flex items-center px-2.5 h-6 rounded-[2px] text-[10px] uppercase tracking-[0.16em] font-medium border border-leaf-deep bg-leaf-tint text-leaf-deep hover:bg-leaf-deep hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {publishing ? "Publishing…" : "Publish →"}
                  </button>
                )}
                {domain.status === "published" && (
                  <button
                    onClick={handleUnpublish}
                    disabled={publishing || unpublishing}
                    className="inline-flex items-center px-2.5 h-6 rounded-[2px] text-[10px] uppercase tracking-[0.16em] font-medium border border-line text-ink-2 hover:border-bad hover:text-bad transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unpublishing ? "Unpublishing…" : "Unpublish"}
                  </button>
                )}
              </BenchAccessGate>
            )}
          </div>
          {publishError && (
            <p className="mt-2 text-xs text-bad">{publishError}</p>
          )}

          {domain.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {domain.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Bench / Env toggle */}
      <div className="mt-10 mb-6 flex items-center gap-4 flex-wrap">
        <BenchEnvToggle mode={mode} onChange={setMode} />
        <p className="text-sm text-ink-2">
          {mode === "bench"
            ? domain.has_gold_benchmark
              ? "Running against the frozen gold-benchmark dataset."
              : "Running benchmark evaluations on this domain."
            : "Interacting with the live environment adapter."}
        </p>
      </div>

      {mode === "bench" ? (
        <BenchPanel domain={domain} leaderboard={leaderboard} envId={envId} />
      ) : (
        <EnvPanel domain={domain} />
      )}

      {/* Version history */}
      <section className="mt-14 pt-8 border-t border-line">
        <h2
          className="text-2xl font-medium text-ink mb-4 [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.012em" }}
        >
          Edition <em>history</em>.
        </h2>
        <VersionHistory
          entries={domain.version_history}
          currentVersion={domain.binding_vow.version}
        />
      </section>
    </div>
  );
}

function BenchPanel({
  domain,
  leaderboard,
  envId,
}: {
  domain: Domain;
  leaderboard: LeaderboardEntry[];
  envId?: string;
}) {
  const scoring = domainScoring(domain);
  return (
    <div className="space-y-12">
      {envId && (
        <p className="text-sm text-ink-2 border border-line rounded-[2px] px-4 py-3 bg-paper-2">
          Runs are scoped to developer environment{" "}
          <span className="num-tab text-ink">{envId.slice(0, 8)}…</span>.
        </p>
      )}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="text-2xl font-medium text-ink [font-family:var(--f-display)]"
            style={{ letterSpacing: "-0.012em" }}
          >
            Recent <em>activity.</em>
          </h2>
          <span className="text-xs text-ink-3">refreshes every 5s</span>
        </div>
        <RecentRuns
          domainId={domain.id}
          bindingVowVersion={domain.binding_vow.version}
          envId={envId}
        />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="text-2xl font-medium text-ink [font-family:var(--f-display)]"
            style={{ letterSpacing: "-0.012em" }}
          >
            The <em>field.</em>
          </h2>
          <span className="text-xs text-ink-3">
            primary metric:{" "}
            <span className="text-ink num-tab">{scoring.primary_metric}</span>
            {" · "}
            {scoring.higher_is_better ? "↑ higher is better" : "↓ lower is better"}
          </span>
        </div>
        <Leaderboard
          entries={leaderboard}
          primaryMetric={scoring.primary_metric}
          higherIsBetter={scoring.higher_is_better}
        />
      </section>

      <section id="run">
        <h2
          className="text-2xl font-medium text-ink [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.012em" }}
        >
          Bench a <em>model.</em>
        </h2>
        <p className="text-sm text-ink-2 mt-1 mb-5">
          Choose which models to evaluate against this domain.
        </p>
        <ModelSelector domain={domain} envId={envId} />
      </section>
    </div>
  );
}

function EnvPanel({ domain }: { domain: Domain }) {
  const endpointUrl = domain.endpoint.url ?? "Not configured";

  return (
    <div className="space-y-6">
      <div className="border border-line rounded-[2px] bg-paper-2 p-6">
        <h2
          className="text-xl font-medium text-ink mb-5 [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.012em" }}
        >
          Environment <em>info.</em>
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="mode" value={domain.endpoint.mode} />
          <Field label="endpoint" value={endpointUrl} />
          <Field label="domain id" value={domain.id} />
          <Field
            label="binding vow"
            value={`${domain.binding_vow.id} v${domain.binding_vow.version}`}
          />
        </dl>
      </div>

      <div className="border border-line rounded-[2px] p-6 bg-paper">
        <h3 className="text-sm font-medium text-ink mb-3 uppercase tracking-[0.16em]">
          Start a run
        </h3>
        <p className="text-sm text-ink-2 mb-4">
          Create a run via the API by posting to{" "}
          <code className="text-xs bg-paper-2 px-1.5 py-0.5 rounded-[2px] text-ink num-tab border border-line">
            POST /v1/runs
          </code>
          :
        </p>
        <pre
          className="text-xs rounded-[2px] p-4 overflow-x-auto leading-relaxed border border-line bg-paper-2 text-ink"
          style={{ fontFamily: "var(--f-mono)" }}
        >
{`{
  "domain_id": "${domain.id}",
  "binding_vow_version": "${domain.binding_vow.version}",
  "agent_config": {
    "model": "claude-sonnet-4-6",
    "temperature": 0.7
  },
  "num_episodes": 5
}`}
        </pre>
        <a
          href={`${API_BASE}/docs#/runs/create_run_v1_runs_post`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink hover:text-leaf-deep transition-colors"
        >
          Open in API docs <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm text-ink num-tab break-all">{value}</dd>
    </div>
  );
}
