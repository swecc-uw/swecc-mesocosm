import { useEffect, useMemo, useState } from "react";
import { fetchRunExport } from "@/lib/api";
import type { RunExport } from "@/types/runExport";
import {
  buildFramesFromExport,
  hasRecordedBoardStates,
  type Cell,
  type TraceFrame,
} from "@/lib/ticTacToeReplay";
import fallbackExport from "@/data/teamTicTacToeRun.json";

/** Gallery run with full board traces (re-record after agent_loop logs after_env). */
export const SHOWCASE_RUN_ID = "58f29d0d-9f9f-41a3-b613-a27cfd71757f";

const FALLBACK = fallbackExport as unknown as RunExport;

function TttBoard({ board, highlight }: { board: Cell[]; highlight?: number | null }) {
  return (
    <div className="sc-ttt-grid" role="grid" aria-label="Tic tac toe board">
      {board.map((cell, i) => (
        <div
          key={i}
          role="gridcell"
          className={`sc-ttt-cell ${cell === "X" ? "sc-ttt-x" : cell === "O" ? "sc-ttt-o" : ""} ${
            highlight === i ? "sc-ttt-highlight" : ""
          }`}
        >
          <span className="sc-ttt-index">{i}</span>
          <span className="sc-ttt-mark">{cell || "·"}</span>
        </div>
      ))}
    </div>
  );
}

function frameLabel(frame: TraceFrame): string {
  switch (frame.kind) {
    case "start":
      return "Episode start — board from env reset";
    case "before_agent":
      return `Step ${frame.step} — board before model (X to move)`;
    case "reasoning":
      return `Step ${frame.step} — model output (recorded verbatim)`;
    case "action":
      return `Step ${frame.step} — parsed action sent to env`;
    case "step_result":
      return `Step ${frame.step} — env step result`;
    case "after_env":
      return `Step ${frame.step} — board after env (O may have moved)`;
    case "episode_end":
      return "Episode end";
    default:
      return "";
  }
}

function highlightCell(frame: TraceFrame): number | null {
  if (frame.kind !== "action" || frame.action == null) return null;
  const n = parseInt(String(frame.action).trim(), 10);
  return Number.isFinite(n) && n >= 0 && n <= 8 ? n : null;
}

export default function TicTacToeReplay() {
  const [exportData, setExportData] = useState<RunExport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchRunExport(SHOWCASE_RUN_ID);
        if (!cancelled) {
          setExportData(data);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setExportData(FALLBACK);
          setLoadError(
            e instanceof Error
              ? `Live export failed (${e.message}); showing bundled fallback.`
              : "Live export failed; showing bundled fallback.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = exportData ?? FALLBACK;
  const frames = useMemo(() => buildFramesFromExport(data), [data]);
  const boardTracesOk = useMemo(() => hasRecordedBoardStates(data), [data]);

  const safeActive =
    frames.length === 0 ? 0 : Math.min(active, frames.length - 1);

  const frame = frames[safeActive];
  const boardFrame = [...frames]
    .slice(0, safeActive + 1)
    .reverse()
    .find((f) => f.board && f.board.length === 9);

  return (
    <div className="sc-ttt-root">
      {loadError && (
        <p className="text-sm text-warn border border-line rounded-[2px] px-3 py-2 bg-paper-2 mb-4">
          {loadError}
        </p>
      )}

      {!boardTracesOk && (
        <p className="text-sm text-bad border border-line rounded-[2px] px-3 py-2 bg-paper-2 mb-4">
          This export predates board logging after each env step. Re-run with an updated bench-api,
          then refresh:{" "}
          <code className="text-xs font-mono bg-paper px-1">
            bench run export {SHOWCASE_RUN_ID}
          </code>
        </p>
      )}

      <div className="border border-line rounded-[2px] bg-paper-2 p-5 mb-8">
        <p className="text-sm text-ink-2 leading-relaxed max-w-prose">
          Every frame is from <strong className="text-ink">trace events</strong> in the run export —
          no simulated opponent. You are <strong className="text-ink">X</strong>; the environment
          server plays <strong className="text-ink">O</strong> inside{" "}
          <code className="text-xs font-mono bg-paper px-1">POST /step</code>. Compare{" "}
          <em>before_agent</em> vs <em>after_env</em> boards to see O&apos;s move.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs num-tab">
          <div>
            <dt className="eyebrow">run</dt>
            <dd className="text-ink mt-1 truncate">{data.run.id}</dd>
          </div>
          <div>
            <dt className="eyebrow">model</dt>
            <dd className="text-ink mt-1">{data.run.config.agent_config.model}</dd>
          </div>
        </dl>
      </div>

      {frame && (
        <div className="grid md:grid-cols-[minmax(0,280px)_1fr] gap-8 items-start">
          {boardFrame?.board ? (
            <TttBoard board={boardFrame.board} highlight={highlightCell(frame)} />
          ) : (
            <div className="sc-ttt-grid sc-ttt-empty border border-line rounded-[2px] p-8 text-sm text-ink-3 text-center">
              No board in this event
            </div>
          )}

          <div>
            <span className="eyebrow">{frameLabel(frame)}</span>
            {frame.kind === "reasoning" && frame.reasoning && (
              <p className="sc-tr-reasoning mt-4 text-base leading-relaxed whitespace-pre-wrap">
                <em>{frame.reasoning}</em>
              </p>
            )}
            {frame.kind === "action" && (
              <p className="mt-4 text-sm num-tab text-ink">
                Action sent to environment:{" "}
                <strong>{String(frame.action)}</strong>
              </p>
            )}
            {frame.kind === "step_result" && (
              <p className="mt-4 text-sm text-ink-2 num-tab">
                reward {frame.reward} · terminated {String(frame.terminated)}
                {frame.info?.outcome ? ` · ${frame.info.outcome}` : ""}
              </p>
            )}
            {frame.message && (
              <p className="mt-3 text-sm text-ink-2 leading-relaxed">{frame.message}</p>
            )}
          </div>
        </div>
      )}

      {frames.length === 0 && (
        <p className="text-sm text-ink-2 italic py-8">No trace frames in export.</p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="sc-ttt-nav"
          disabled={active <= 0}
          onClick={() => setActive((i) => Math.max(0, i - 1))}
        >
          ← Prev
        </button>
        <span className="text-xs text-ink-3 num-tab px-2">
          {frames.length ? active + 1 : 0} / {frames.length}
        </span>
        <button
          type="button"
          className="sc-ttt-nav"
          disabled={active >= frames.length - 1}
          onClick={() => setActive((i) => Math.min(frames.length - 1, i + 1))}
        >
          Next →
        </button>
      </div>

      <ol className="mt-10 space-y-2 border-t border-line pt-6 max-h-64 overflow-y-auto">
        {frames.map((f, i) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className={`w-full text-left px-3 py-2 rounded-[2px] text-sm transition-colors ${
                i === active ? "bg-leaf-tint text-ink" : "hover:bg-paper-2 text-ink-2"
              }`}
            >
              {frameLabel(f)}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
