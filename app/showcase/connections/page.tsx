import Link from "next/link";
import Connections from "@/components/showcase/Connections";
import "../showcase.css";

export const metadata = {
  title: "Connections — a thinking room · Mesocosm",
};

const REQUEST_BODY = `{
  "domain_id": "connections-puzzle",
  "binding_vow_version": "1.0.0",
  "agent_config": {
    "model": "claude-sonnet-4-6",
    "temperature": 0.0
  },
  "seed_set": [142],
  "num_episodes": 1
}`;

const RESPONSE_BODY = `{
  "id": "run_01HXG7…",
  "status": "running",
  "config": { /* echo of the request */ },
  "requester_id": "you",
  "created_at": "2026-04-27T14:22:08Z",
  "scores": {}
}`;

export default function ConnectionsShowcasePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          href="/showcase"
          className="text-sm text-ink-2 hover:text-ink transition-colors inline-flex items-center gap-1.5"
        >
          <span aria-hidden>←</span> Showcase
        </Link>
      </nav>

      {/* Hero */}
      <header className="pb-8 border-b border-line">
        <span className="eyebrow eyebrow-leaf">— exhibit · 001 · how it works</span>
        <h1
          className="mt-3 text-5xl font-medium text-ink leading-tight [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.018em" }}
        >
          Connections, <em>a thinking room.</em>
        </h1>
        <p className="mt-4 text-lg text-ink-2 leading-relaxed max-w-prose">
          A model is handed a 4×4 board of sixteen words and asked to find four
          hidden categories. We show you the request we make, the response we
          get back, and then play the episode out turn by turn.
        </p>
      </header>

      {/* 1. The request */}
      <Section
        eyebrow="i. the request"
        title={<>What we <em>send.</em></>}
        body="The platform speaks one verb to start an episode: a typed POST to /v1/runs. The body is bound to the domain's binding vow — observation, action, and reward shapes are checked before the run is admitted."
      >
        <CodePanel label="POST /v1/runs" body={REQUEST_BODY} />
      </Section>

      {/* 2. Execution + response */}
      <Section
        eyebrow="ii. the execution"
        title={<>What we <em>do</em> with it.</>}
        body="We allocate a sandbox, instantiate the env adapter at the locked vow version, hand the agent the first observation, and stream every step into the run trace. The orchestrator returns a Run record immediately; scores fill in as episodes complete."
      >
        <ExecutionTrace />
        <div className="mt-4">
          <CodePanel label="response · 202 accepted" body={RESPONSE_BODY} />
        </div>
      </Section>

      {/* 3. The simulation */}
      <section className="mt-16 pt-10 border-t border-line">
        <span className="eyebrow eyebrow-leaf">— iii. the simulation</span>
        <h2
          className="mt-3 text-3xl font-medium text-ink [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.015em" }}
        >
          Watch the <em>episode</em> play.
        </h2>
        <p className="mt-3 text-ink-2 max-w-prose leading-relaxed">
          One turn per vertical section: the state of the board, the model's
          thinking label, its typed reasoning, and the action it commits.
          Wrong guesses shake; correct ones lift away.
        </p>
        <div className="mt-8">
          <Connections />
        </div>
      </section>
    </div>
  );
}

// ── Section primitives (page-local) ────────────────────────────────
function Section({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 pt-10 border-t border-line">
      <span className="eyebrow eyebrow-leaf">— {eyebrow}</span>
      <h2
        className="mt-3 text-3xl font-medium text-ink [font-family:var(--f-display)]"
        style={{ letterSpacing: "-0.015em" }}
      >
        {title}
      </h2>
      <p className="mt-3 text-ink-2 max-w-prose leading-relaxed">{body}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function CodePanel({ label, body }: { label: string; body: string }) {
  return (
    <div className="border border-line rounded-[2px] overflow-hidden bg-paper-2">
      <div className="px-4 py-2 border-b border-line">
        <span className="eyebrow">{label}</span>
      </div>
      <pre
        className="px-4 py-4 text-xs text-ink overflow-x-auto leading-relaxed"
        style={{ fontFamily: "var(--f-mono)" }}
      >
        {body}
      </pre>
    </div>
  );
}

function ExecutionTrace() {
  const steps = [
    { n: "i.",   label: "validate", detail: "Vow lookup, version pin, agent config schema check." },
    { n: "ii.",  label: "allocate", detail: "Sandbox boots; env adapter loads at locked version." },
    { n: "iii.", label: "step",     detail: "Observation → agent → action → reward, recorded." },
    { n: "iv.",  label: "rank",     detail: "Episode reward → primary metric → leaderboard write." },
  ];
  return (
    <ol className="border border-line rounded-[2px] overflow-hidden bg-paper">
      {steps.map((s, i) => (
        <li
          key={s.n}
          className={`grid grid-cols-[48px_120px_1fr] items-baseline gap-4 px-4 py-3 ${i < steps.length - 1 ? "border-b border-line" : ""}`}
        >
          <span className="num-old text-lg text-leaf-deep">{s.n}</span>
          <span className="eyebrow">{s.label}</span>
          <span className="text-sm text-ink-2 leading-relaxed">{s.detail}</span>
        </li>
      ))}
    </ol>
  );
}
