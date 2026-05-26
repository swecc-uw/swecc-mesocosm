import { useEffect } from "react";
import { Link } from "react-router-dom";
import TicTacToeReplay from "@/components/showcase/TicTacToeReplay";
import "../showcase.css";

export function ShowcaseTicTacToePage() {
  useEffect(() => {
    document.title = "Tic tac toe replay — Mesocosm";
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
        <span className="eyebrow eyebrow-leaf">— exhibit · 003 · live export</span>
        <h1
          className="mt-3 text-5xl font-medium text-ink leading-tight [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.018em" }}
        >
          Tic tac toe, <em>from JSON.</em>
        </h1>
        <p className="mt-4 text-lg text-ink-2 leading-relaxed max-w-prose">
          A temporary third showcase: the real{" "}
          <code className="text-sm font-mono bg-paper-2 px-1 rounded">bench run export</code> from
          team Winners on the smoke-test domain. Use it to see who moves when — model as X,
          environment as O.
        </p>
      </header>

      <section className="mt-10">
        <TicTacToeReplay />
      </section>

      <p className="mt-10 text-sm text-ink-3">
        Also view on the API:{" "}
        <Link
          to="/runs/58f29d0d-9f9f-41a3-b613-a27cfd71757f"
          className="text-leaf-deep underline underline-offset-2"
        >
          public run replay
        </Link>
        {" · "}
        export file lives in{" "}
        <code className="text-xs font-mono bg-paper-2 px-1 rounded">src/data/teamTicTacToeRun.json</code>.
      </p>
    </div>
  );
}
