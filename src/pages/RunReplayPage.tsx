import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRunExport } from "@/lib/api";
import type { ReplayTurn, RunExport } from "@/types/runExport";

export function RunReplayPage() {
  const { runId } = useParams<{ runId: string }>();
  const [data, setData] = useState<RunExport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!runId) return;
    document.title = `Run ${runId.slice(0, 8)}… — Mesocosm`;
    let cancelled = false;
    (async () => {
      try {
        const exp = await fetchRunExport(runId);
        if (!cancelled) setData(exp);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load run");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const episodeId = data?.episodes[0]?.id;
  const turns: ReplayTurn[] =
    episodeId && data?.replay[episodeId] ? data.replay[episodeId] : [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="mb-8">
        <Link
          to={data?.domain_id ? `/domains/${data.domain_id}` : "/"}
          className="text-sm text-ink-2 hover:text-ink transition-colors inline-flex items-center gap-1.5"
        >
          <span aria-hidden>←</span>
          {data?.domain_name ?? "Back"}
        </Link>
      </nav>

      <header className="pb-8 border-b border-line">
        <span className="eyebrow eyebrow-leaf">— run replay</span>
        <h1
          className="mt-3 text-4xl font-medium text-ink [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.018em" }}
        >
          Public <em>replay.</em>
        </h1>
        <p className="mt-4 text-sm text-ink-2 leading-relaxed max-w-prose">
          Step-by-step model reasoning and actions from a bench run. Gallery-public runs load
          without signing in. Export the same JSON with{" "}
          <code className="text-xs font-mono bg-paper-2 px-1 rounded">bench run export</code> for
          a showcase in your repo.
        </p>
        {data && (
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs num-tab">
            <div>
              <dt className="eyebrow">run</dt>
              <dd className="text-ink mt-1 truncate">{data.run.id}</dd>
            </div>
            <div>
              <dt className="eyebrow">model</dt>
              <dd className="text-ink mt-1">{data.run.config.agent_config.model}</dd>
            </div>
            <div>
              <dt className="eyebrow">status</dt>
              <dd className="text-ink mt-1">{data.run.status}</dd>
            </div>
            <div>
              <dt className="eyebrow">visibility</dt>
              <dd className="text-ink mt-1">{data.visibility ?? "—"}</dd>
            </div>
          </dl>
        )}
      </header>

      {loading && <p className="text-sm text-ink-2 py-12">Loading replay…</p>}
      {error && (
        <p className="text-sm text-bad border border-line rounded-[2px] px-4 py-3 bg-paper-2">
          {error}
        </p>
      )}

      {!loading && !error && turns.length === 0 && (
        <p className="text-sm text-ink-2 italic py-12">
          No replay turns yet — run may still be in progress, or traces were recorded before
          reasoning export was enabled.
        </p>
      )}

      {turns.length > 0 && (
        <ol className="mt-10 space-y-10">
          {turns.map((turn) => (
            <li key={turn.step} className="border border-line rounded-[2px] bg-paper p-5">
              <span className="eyebrow">step {turn.step}</span>
              {turn.observation !== undefined && (
                <div className="mt-4">
                  <p className="eyebrow mb-2">observation</p>
                  <pre
                    className="text-xs text-ink-2 overflow-x-auto bg-paper-2 border border-line rounded-[2px] p-3 whitespace-pre-wrap"
                    style={{ fontFamily: "var(--f-mono)" }}
                  >
                    {JSON.stringify(turn.observation, null, 2)}
                  </pre>
                </div>
              )}
              {turn.reasoning && (
                <div className="mt-4">
                  <p className="eyebrow mb-2">reasoning</p>
                  <p
                    className="text-base text-ink leading-relaxed [font-family:var(--f-display)]"
                    style={{ letterSpacing: "-0.01em" }}
                  >
                    <em>{turn.reasoning}</em>
                  </p>
                </div>
              )}
              {turn.action !== undefined && (
                <div className="mt-4">
                  <p className="eyebrow mb-2">action</p>
                  <pre
                    className="text-xs text-ink num-tab overflow-x-auto bg-paper-2 border border-line rounded-[2px] p-3 whitespace-pre-wrap"
                    style={{ fontFamily: "var(--f-mono)" }}
                  >
                    {typeof turn.action === "string"
                      ? turn.action
                      : JSON.stringify(turn.action, null, 2)}
                  </pre>
                </div>
              )}
              {(turn.reward !== undefined || turn.terminated !== undefined) && (
                <p className="mt-3 text-xs text-ink-3 num-tab">
                  reward {turn.reward ?? "—"}
                  {turn.terminated != null && ` · terminated ${String(turn.terminated)}`}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {data && (
        <p className="mt-10 text-xs text-ink-3">
          API:{" "}
          <code className="font-mono bg-paper-2 px-1 rounded">
            GET /v1/runs/{runId}/export
          </code>
        </p>
      )}
    </div>
  );
}
