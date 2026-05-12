import { useEffect } from "react";
import { Link } from "react-router-dom";
import Trading from "@/components/showcase/Trading";
import "../showcase.css";

const REQUEST_BODY = `{
  "domain_id": "day-trader",
  "binding_vow_version": "0.4.0",
  "agent_config": {
    "model": "claude-sonnet-4-6",
    "temperature": 0.0,
    "techniques": [
      { "technique_id": "newswire-stream", "params": { "delay_s": 0 } }
    ]
  },
  "seed_set": [42],
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

export function ShowcaseTradingPage() {
  useEffect(() => {
    document.title = "Day trader — a single session · Mesocosm";
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <nav className="mb-8">
        <Link
          to="/showcase"
          className="text-sm text-ink-2 hover:text-ink transition-colors inline-flex items-center gap-1.5"
        >
          <span aria-hidden>←</span> Showcase
        </Link>
      </nav>

      <header className="pb-8 border-b border-line">
        <span className="eyebrow eyebrow-leaf">— exhibit · 002 · how it works</span>
        <h1
          className="mt-3 text-5xl font-medium text-ink leading-tight [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.018em" }}
        >
          Day trader, <em>a single session.</em>
        </h1>
        <p className="mt-4 text-lg text-ink-2 leading-relaxed max-w-prose">
          $100,000 cash, six tickers, one streaming news wire, five decisions across a market day. We show you the request we send, what the
          platform does, and then play the session out tick by tick.
        </p>
      </header>

      <Section
        eyebrow="i. the request"
        title={<>What we <em>send.</em></>}
        body="Same verb as any other run: a typed POST to /v1/runs bound to the day-trader vow. A technique declares the news wire stream so the env adapter knows to push headlines on the agent's channel."
      >
        <CodePanel label="POST /v1/runs" body={REQUEST_BODY} />
      </Section>

      <Section
        eyebrow="ii. the execution"
        title={<>What we <em>do</em> with it.</>}
        body="The platform allocates a market sandbox, replays a fixed news fixture for the seed, and streams every order/fill through the trace. Scores fill in once the session closes."
      >
        <ExecutionTrace />
        <div className="mt-4">
          <CodePanel label="response · 202 accepted" body={RESPONSE_BODY} />
        </div>
      </Section>

      <section className="mt-16 pt-10 border-t border-line">
        <span className="eyebrow eyebrow-leaf">— iii. the simulation</span>
        <h2
          className="mt-3 text-3xl font-medium text-ink [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.015em" }}
        >
          Watch the <em>session</em> trade.
        </h2>
        <p className="mt-3 text-ink-2 max-w-prose leading-relaxed">
          Portfolio on the left, the model&apos;s turn-by-turn reasoning in the centre, the news wire on the right. Each turn: news lands, the
          model thinks, an order ships, the tape moves.
        </p>
      </section>

      <div className="mt-8 -mx-6">
        <div className="px-6">
          <Trading />
        </div>
      </div>
    </div>
  );
}

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
    { n: "i.", label: "validate", detail: "Vow lookup, version pin, technique declaration check." },
    { n: "ii.", label: "allocate", detail: "Market sandbox boots; news fixture seeds at 042." },
    { n: "iii.", label: "step", detail: "Wire push → agent → order → tape, recorded turn by turn." },
    { n: "iv.", label: "score", detail: "PnL, Sharpe, drawdown rolled up to the session score." },
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
