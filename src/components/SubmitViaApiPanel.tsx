import { useState } from "react";
import { PRODUCTION_API_BASE } from "@/lib/env";

const CLI_INSTALL = "pip install swecc-mesocosm";

type TabId = "cli" | "curl";

function SnippetBlock({
  label,
  snippet,
}: {
  label: string;
  snippet: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="border border-line rounded-[2px] overflow-hidden bg-paper-2">
      <div className="flex items-center justify-between px-4 py-2 border-b border-line">
        <span className="eyebrow">{label}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="text-xs text-ink-2 hover:text-ink transition-colors uppercase tracking-[0.16em]"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre
        className="px-4 py-4 text-xs text-ink overflow-x-auto leading-relaxed whitespace-pre-wrap break-all"
        style={{ fontFamily: "var(--f-mono)" }}
      >
        {snippet}
      </pre>
    </div>
  );
}

function cliSnippet(): string {
  return `# One-time install (PyPI)
${CLI_INSTALL}

# Scaffold a new env repo (benchanything.json, adapter.py, env.py, showcase/)
bench init

# Defaults: api.swecc.org + /bench (override with SWECC_SERVER_URL / SWECC_BENCH_URL)
bench auth login --username YOUR_USER --password YOUR_PASSWORD

bench env submit \\
  --name "My coding bench" \\
  --github-url "https://github.com/your-org/your-env" \\
  --description "Env with benchanything.json at repo root"

# Optional: attribute env to your active team
# bench team use TEAM_UUID
# bench env submit ...`;
}

function curlSnippet(): string {
  return `# curl needs a Bearer token — get it from the bench CLI (no manual CSRF/JWT dance)

# 1) Install + log in (saves session to ~/.config/swecc/bench_credentials.json)
${CLI_INSTALL}
bench auth login --username YOUR_USER --password YOUR_PASSWORD

# 2) Export JWT for this shell (run again after logout or if you get 401)
export TOKEN=$(bench auth token)
# optional: bench auth token          # print token to stdout
# optional: echo "$TOKEN" | head -c 24 && echo "..."

# 3) Point curl at production bench-api
export BENCH=${PRODUCTION_API_BASE}

# 4) Submit environment
curl -X POST "$BENCH/v1/developer/environments" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My coding bench",
    "github_url": "https://github.com/your-org/your-env",
    "description": "Env with benchanything.json at repo root"
  }'`;
}

export function SubmitViaApiPanel() {
  const [tab, setTab] = useState<TabId>("cli");
  const tabs: { id: TabId; label: string }[] = [
    { id: "cli", label: "bench CLI" },
    { id: "curl", label: "curl · advanced" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 border-b border-line pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-xs uppercase tracking-[0.14em] px-2 py-1 rounded-[2px] transition-colors ${
              tab === t.id
                ? "bg-leaf-tint text-leaf-deep font-medium"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
        <a
          href={`${PRODUCTION_API_BASE}/docs#/developer`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs uppercase tracking-[0.14em] text-ink-2 hover:text-leaf-deep"
        >
          OpenAPI docs →
        </a>
      </div>

      {tab === "cli" && <SnippetBlock label="production · bench CLI" snippet={cliSnippet()} />}
      {tab === "curl" && (
        <SnippetBlock label="production · curl + CLI token" snippet={curlSnippet()} />
      )}

      <p className="text-xs text-ink-3 leading-relaxed">
        {tab === "curl" ? (
          <>
            Curl cannot read the CLI credential file — you must{" "}
            <code className="font-mono bg-paper-2 px-1 rounded">bench auth login</code> first, then{" "}
            <code className="font-mono bg-paper-2 px-1 rounded">export TOKEN=$(bench auth token)</code>{" "}
            in every new terminal. Re-run login + export if you get{" "}
            <code className="font-mono bg-paper-2 px-1 rounded">401</code>.
          </>
        ) : (
          <>
            The <code className="font-mono bg-paper-2 px-1 rounded">bench</code> CLI is the
            supported path for submit, teams, and runs. It stores your session locally (
            <code className="font-mono bg-paper-2 px-1 rounded">~/.config/swecc/bench_credentials.json</code>
            ) and defaults to production URLs — no{" "}
            <code className="font-mono bg-paper-2 px-1 rounded">--bench-url</code> flags needed.
          </>
        )}
      </p>
    </div>
  );
}
