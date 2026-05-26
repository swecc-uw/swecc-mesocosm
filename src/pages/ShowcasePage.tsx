import { useEffect } from "react";
import { Link } from "react-router-dom";

const DEMOS = [
  {
    slug: "connections",
    number: "001",
    title: "Connections",
    subtitle: "a thinking room",
    contract: "text → discrete[16] → binary",
    description:
      "Sixteen words, four hidden groups. Watch a model cluster, fail, and recover across four turns.",
  },
  {
    slug: "trading",
    number: "002",
    title: "Day trader",
    subtitle: "a single session",
    contract: "composite → json → scalar",
    description:
      "An agent allocates capital across six tickers over a trading day, reading a streaming news feed.",
  },
];

export function ShowcasePage() {
  useEffect(() => {
    document.title = "Showcase — Mesocosm";
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="pb-8 border-b border-line">
        <span className="eyebrow eyebrow-leaf">— how it works</span>
        <h1
          className="mt-3 text-5xl font-medium text-ink leading-tight [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.018em" }}
        >
          The <em>showcase.</em>
        </h1>
        <p className="mt-4 text-lg text-ink-2 leading-relaxed max-w-prose">
          Curated demonstrations — typed contract, HTTP exchange, and episode replay. Each entry is a
          scripted guide through a real environment shape.
        </p>
      </header>

      <ol className="mt-10 space-y-px border border-line rounded-[2px] overflow-hidden">
        {DEMOS.map((demo, i) => (
          <li key={demo.slug} className={i > 0 ? "border-t border-line" : ""}>
            <Link
              to={`/showcase/${demo.slug}`}
              className="group flex items-start gap-5 px-5 py-5 bg-paper hover:bg-paper-2 transition-colors"
            >
              <span className="eyebrow pt-0.5 shrink-0 w-8">{demo.number}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg font-medium text-ink [font-family:var(--f-display)]">{demo.title},</span>
                  <span className="text-lg italic text-ink-2 [font-family:var(--f-display)]">{demo.subtitle}.</span>
                </div>
                <p className="mt-1 text-sm text-ink-2 leading-relaxed">{demo.description}</p>
                <span className="mt-2 inline-block text-[11px] uppercase tracking-[0.16em] font-medium text-ink-3">
                  {demo.contract}
                </span>
              </div>
              <span className="text-sm text-ink-3 group-hover:text-ink transition-colors shrink-0 mt-0.5" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-sm text-ink-3">
        Looking for real environments to bench against?{" "}
        <Link
          to="/"
          state={{ scrollToGallery: true }}
          className="text-ink hover:text-leaf-deep transition-colors underline underline-offset-2"
        >
          Browse the gallery →
        </Link>
      </p>
    </div>
  );
}
