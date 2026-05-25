import { useState } from "react";
import {
  API_BASE,
  AUTH_API_BASE,
  PRODUCTION_API_BASE,
  PRODUCTION_AUTH_API_BASE,
} from "@/lib/env";

type TabId = "curl-prod" | "curl-local" | "cli";

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

function prodCurlSnippet(): string {
  return `# 1) Member JWT via swecc-server (same auth as mesocosm / engagement)
SERVER=${PRODUCTION_AUTH_API_BASE}
BENCH=${PRODUCTION_API_BASE}

CSRF=$(curl -s -c bench-cookies.txt "$SERVER/auth/csrf/" -D - -o /dev/null | tr -d '\\r' | grep -i x-csrftoken | awk '{print $2}')
curl -s -b bench-cookies.txt -c bench-cookies.txt -X POST "$SERVER/auth/login/" \\
  -H "Content-Type: application/json" -H "X-CSRFToken: $CSRF" \\
  -d '{"username":"YOUR_USER","password":"YOUR_PASSWORD"}'

TOKEN=$(curl -s -b bench-cookies.txt "$SERVER/auth/jwt/" | jq -r .token)

# 2) Submit environment (repo must have benchanything.json at root)
curl -X POST "$BENCH/v1/developer/environments" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "FWT Tic Tac Toe",
    "github_url": "https://github.com/FWT-bs/environments",
    "description": "Tic-tac-toe env with benchanything.json at repo root"
  }'`;
}

function localCurlSnippet(): string {
  return `# Local stack (docker compose --profile with-nginx up)
SERVER=${AUTH_API_BASE}
BENCH=${API_BASE}

CSRF=$(curl -s -c bench-cookies.txt "$SERVER/auth/csrf/" -D - -o /dev/null | tr -d '\\r' | grep -i x-csrftoken | awk '{print $2}')
curl -s -b bench-cookies.txt -c bench-cookies.txt -X POST "$SERVER/auth/login/" \\
  -H "Content-Type: application/json" -H "X-CSRFToken: $CSRF" \\
  -d '{"username":"YOUR_USER","password":"YOUR_PASSWORD"}'

TOKEN=$(curl -s -b bench-cookies.txt "$SERVER/auth/jwt/" | jq -r .token)

curl -X POST "$BENCH/v1/developer/environments" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "FWT Tic Tac Toe",
    "github_url": "https://github.com/FWT-bs/environments",
    "description": "Tic-tac-toe env with benchanything.json at repo root"
  }'`;
}

function prodCliSnippet(): string {
  return `# Install CLI from swecc-core (once):
#   cd services/bench/common && pip install -e .

bench --bench-url ${PRODUCTION_API_BASE} auth login \\
  --server-url ${PRODUCTION_AUTH_API_BASE} \\
  --username YOUR_USER --password YOUR_PASSWORD

bench --bench-url ${PRODUCTION_API_BASE} env submit \\
  --name "FWT Tic Tac Toe" \\
  --github-url "https://github.com/FWT-bs/environments" \\
  --description "Tic-tac-toe env with benchanything.json at repo root"

# Optional: credit submission to a team you belong to
# bench --bench-url ${PRODUCTION_API_BASE} team use TEAM_UUID
# bench --bench-url ${PRODUCTION_API_BASE} env submit ...`;
}

function localCliSnippet(): string {
  return `bench --bench-url ${API_BASE} auth login \\
  --server-url ${AUTH_API_BASE} \\
  --username YOUR_USER --password YOUR_PASSWORD

bench --bench-url ${API_BASE} env submit \\
  --name "FWT Tic Tac Toe" \\
  --github-url "https://github.com/FWT-bs/environments" \\
  --description "Tic-tac-toe env with benchanything.json at repo root"`;
}

export function SubmitViaApiPanel() {
  const showLocal = import.meta.env.DEV;
  const tabs: { id: TabId; label: string }[] = [
    { id: "curl-prod", label: "curl · production" },
    ...(showLocal ? [{ id: "curl-local" as const, label: "curl · local" }] : []),
    { id: "cli", label: "bench CLI" },
  ];
  const [tab, setTab] = useState<TabId>("curl-prod");

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

      {tab === "curl-prod" && (
        <SnippetBlock label="production · curl" snippet={prodCurlSnippet()} />
      )}
      {tab === "curl-local" && showLocal && (
        <SnippetBlock label="local dev · curl" snippet={localCurlSnippet()} />
      )}
      {tab === "cli" && (
        <div className="space-y-4">
          <SnippetBlock label="production · bench CLI" snippet={prodCliSnippet()} />
          {showLocal && (
            <SnippetBlock label="local dev · bench CLI" snippet={localCliSnippet()} />
          )}
        </div>
      )}

      <p className="text-xs text-ink-3 leading-relaxed">
        Member login is required. Optional <code className="font-mono bg-paper-2 px-1 rounded">team_id</code>{" "}
        in the JSON body (or <code className="font-mono bg-paper-2 px-1 rounded">bench team use</code>)
        attributes the env to your active team.
      </p>
    </div>
  );
}
