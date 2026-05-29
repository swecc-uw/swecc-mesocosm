"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Puzzle data ─────────────────────────────────────────────────────
type CategoryId = "pizza" | "blades" | "hire" | "stains";

interface Category {
  id: CategoryId;
  label: string;
  cls: string;
  words: string[];
}

const CATEGORIES: Record<CategoryId, Category> = {
  pizza:  { id: "pizza",  label: "Pizza toppings",   cls: "sc-cat-yellow", words: ["TOMATO SAUCE", "DOUGH", "CHEESE", "PEPPERONI"] },
  blades: { id: "blades", label: "Things with blades", cls: "sc-cat-green",  words: ["HELICOPTER", "ICE SKATES", "LAWN MOWER", "GRASS"] },
  hire:   { id: "hire",   label: "Vehicles for hire", cls: "sc-cat-blue",   words: ["TAXI", "LIMO", "TRUCK", "VAN"] },
  stains: { id: "stains", label: "Things that stain", cls: "sc-cat-purple", words: ["INK", "WINE", "COFFEE", "MUD"] },
};

const INITIAL_BOARD = [
  "HELICOPTER", "TOMATO SAUCE", "WINE", "TAXI",
  "DOUGH", "GRASS", "INK", "LIMO",
  "CHEESE", "ICE SKATES", "TRUCK", "COFFEE",
  "PEPPERONI", "LAWN MOWER", "VAN", "MUD",
];

// ── Turn scripts ────────────────────────────────────────────────────
type SegStyle = "plain" | "caps" | "em";
interface Segment { t: string; style: SegStyle; }

interface Turn {
  n: string;
  thinking: string;
  reasoning: Segment[];
  guess: string[];
  result: "wrong" | "correct";
  oneAway?: string;
  solves?: CategoryId;
  solvedBefore: CategoryId[];
  autoResolve?: CategoryId;
}

const TURNS: Turn[] = [
  {
    n: "I.",
    thinking: "Clustering by surface features",
    reasoning: [
      { t: "Four items are clearly edible: ", style: "plain" },
      { t: "TOMATO SAUCE, DOUGH, CHEESE, PEPPERONI", style: "caps" },
      { t: ". But ", style: "plain" },
      { t: "GRASS", style: "caps" },
      { t: " pairs oddly — cows eat grass. Let me try ", style: "plain" },
      { t: "food-adjacent", style: "em" },
      { t: " and group ", style: "plain" },
      { t: "TOMATO SAUCE, CHEESE, PEPPERONI, GRASS", style: "caps" },
      { t: " as things that are green or red on a pizza.", style: "plain" },
    ],
    guess: ["TOMATO SAUCE", "CHEESE", "PEPPERONI", "GRASS"],
    result: "wrong",
    oneAway: "One away. GRASS isn't a pizza topping.",
    solvedBefore: [],
  },
  {
    n: "II.",
    thinking: "Adjusting after failed guess",
    reasoning: [
      { t: "The shake tells me ", style: "plain" },
      { t: "three were right", style: "em" },
      { t: ". Swapping ", style: "plain" },
      { t: "GRASS", style: "caps" },
      { t: " out for ", style: "plain" },
      { t: "DOUGH", style: "caps" },
      { t: " — the base of every pizza.", style: "plain" },
    ],
    guess: ["TOMATO SAUCE", "DOUGH", "CHEESE", "PEPPERONI"],
    result: "correct",
    solves: "pizza",
    solvedBefore: [],
  },
  {
    n: "III.",
    thinking: "Looking for sharper categories",
    reasoning: [
      { t: "GRASS", style: "caps" },
      { t: " has blades. So do ", style: "plain" },
      { t: "HELICOPTER, ICE SKATES, LAWN MOWER", style: "caps" },
      { t: ". ", style: "plain" },
      { t: "That's my next group.", style: "em" },
    ],
    guess: ["HELICOPTER", "ICE SKATES", "LAWN MOWER", "GRASS"],
    result: "correct",
    solves: "blades",
    solvedBefore: ["pizza"],
  },
  {
    n: "IV.",
    thinking: "Resolving the remaining eight",
    reasoning: [
      { t: "Eight left. ", style: "plain" },
      { t: "TAXI, LIMO, TRUCK, VAN", style: "caps" },
      { t: " are all vehicles you can hire. The rest — ", style: "plain" },
      { t: "INK, WINE, COFFEE, MUD", style: "caps" },
      { t: " — all stain. ", style: "plain" },
      { t: "Submitting vehicles first.", style: "em" },
    ],
    guess: ["TAXI", "LIMO", "TRUCK", "VAN"],
    result: "correct",
    solves: "hire",
    solvedBefore: ["pizza", "blades"],
    autoResolve: "stains",
  },
];

// ── Reasoning typewriter ────────────────────────────────────────────
function TypedReasoning({
  segments,
  onDone,
}: {
  segments: Segment[];
  onDone?: () => void;
}) {
  const flat = useMemo(() => {
    const out: { ch: string; si: number; style: SegStyle }[] = [];
    segments.forEach((seg, si) => {
      for (let i = 0; i < seg.t.length; i++) {
        out.push({ ch: seg.t[i], si, style: seg.style });
      }
    });
    return out;
  }, [segments]);

  const [revealIndex, setRevealIndex] = useState(0);
  const onDoneRef = useRef(onDone);
  const doneCalledRef = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (revealIndex >= flat.length) {
      if (!doneCalledRef.current) {
        doneCalledRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }
    const ch = flat[revealIndex].ch;
    let delay = 18;
    if (ch === " ") delay = 12;
    if (/[.,—]/.test(ch)) delay = 140;
    const id = setTimeout(() => setRevealIndex((c) => c + 1), delay);
    return () => clearTimeout(id);
  }, [revealIndex, flat]);

  const visible: { si: number; style: SegStyle; t: string }[] = [];
  for (let i = 0; i < revealIndex; i++) {
    const f = flat[i];
    const last = visible[visible.length - 1];
    if (last && last.si === f.si) last.t += f.ch;
    else visible.push({ si: f.si, style: f.style, t: f.ch });
  }

  return (
    <div className="sc-reasoning">
      {visible.map((v, i) => {
        if (v.style === "em") return <em key={i}>{v.t}</em>;
        if (v.style === "caps") return <span key={i} className="sc-word-caps">{v.t}</span>;
        return <span key={i}>{v.t}</span>;
      })}
      <span className="sc-caret" />
    </div>
  );
}

// ── Board + solved rows ─────────────────────────────────────────────
function Board({
  remaining,
  selected,
  wrongFlash,
  fadingOut,
}: {
  remaining: string[];
  selected: string[];
  wrongFlash: boolean;
  fadingOut: string[];
}) {
  return (
    <div className="sc-board">
      {remaining.map((word) => {
        const isSel = selected.includes(word);
        const isWrong = wrongFlash && isSel;
        const isFading = fadingOut.includes(word);
        const cls = ["sc-tile"];
        if (isWrong) cls.push("sc-wrong");
        else if (isSel) cls.push("sc-selected");
        if (isFading) cls.push("sc-fading");
        return (
          <div key={word} className={cls.join(" ")}>
            {word}
          </div>
        );
      })}
    </div>
  );
}

function SolvedRows({ ids }: { ids: CategoryId[] }) {
  return (
    <div className="sc-solved-rows">
      {ids.map((id) => {
        const c = CATEGORIES[id];
        return (
          <div key={id} className={`sc-solved-row ${c.cls}`}>
            <span className="sc-cat">{c.label}</span>
            <span className="sc-words">{c.words.join(", ")}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── One turn ────────────────────────────────────────────────────────
type Phase = "thinking" | "reasoning" | "selecting" | "reacting" | "done";

function TurnSection({
  turn,
  index,
  onDone,
}: {
  turn: Turn;
  index: number;
  onDone: (i: number) => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState<Phase>("thinking");
  const [selected, setSelected] = useState<string[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [fadingOut, setFadingOut] = useState<string[]>([]);
  const [solvedDuringThis, setSolvedDuringThis] = useState(false);
  const [showOneAway, setShowOneAway] = useState(false);
  const [autoResolved, setAutoResolved] = useState(false);

  // Smooth-scroll this turn into view in the page.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  // Notify parent when this turn finishes.
  useEffect(() => {
    if (phase === "done") {
      const id = setTimeout(
        () => onDone(index),
        turn.autoResolve ? 2200 : 900,
      );
      return () => clearTimeout(id);
    }
  }, [phase, index, onDone, turn.autoResolve]);

  const handleReasoningDone = useCallback(() => {
    setSelected([]);
    setPhase((p) => (p === "reasoning" ? "selecting" : p));
  }, []);

  useEffect(() => {
    if (phase !== "thinking") return;
    const id = setTimeout(() => setPhase("reasoning"), 1400);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "selecting") return;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    turn.guess.forEach((word, i) => {
      timeouts.push(
        setTimeout(() => {
          if (cancelled) return;
          setSelected((prev) => [...prev, word]);
          if (i === turn.guess.length - 1) {
            timeouts.push(
              setTimeout(() => {
                if (!cancelled) setPhase("reacting");
              }, 650),
            );
          }
        }, 280 * (i + 1)),
      );
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [phase, turn.guess]);

  useEffect(() => {
    if (phase !== "reacting") return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (turn.result === "wrong") {
      queueMicrotask(() => setWrongFlash(true));
      timeouts.push(setTimeout(() => setShowOneAway(true), 500));
      timeouts.push(
        setTimeout(() => {
          setWrongFlash(false);
          setSelected([]);
          timeouts.push(
            setTimeout(() => {
              setShowOneAway(false);
              setPhase("done");
            }, 700),
          );
        }, 1800),
      );
    } else {
      timeouts.push(setTimeout(() => setFadingOut([...turn.guess]), 400));
      timeouts.push(
        setTimeout(() => {
          setSolvedDuringThis(true);
          setPhase("done");
        }, 1100),
      );
    }

    return () => timeouts.forEach(clearTimeout);
  }, [phase, turn.guess, turn.result]);

  useEffect(() => {
    if (phase === "done" && turn.autoResolve && !autoResolved) {
      const id = setTimeout(() => setAutoResolved(true), 1600);
      return () => clearTimeout(id);
    }
  }, [phase, turn, autoResolved]);

  const solvedIds: CategoryId[] = [...turn.solvedBefore];
  if (solvedDuringThis && turn.solves) solvedIds.push(turn.solves);

  const solvedWordsBefore = turn.solvedBefore.flatMap(
    (id) => CATEGORIES[id].words,
  );
  const remaining = INITIAL_BOARD.filter(
    (w) => !solvedWordsBefore.includes(w),
  );
  const finalRemaining =
    solvedDuringThis && turn.solves
      ? remaining.filter((w) => !CATEGORIES[turn.solves!].words.includes(w))
      : remaining;
  const boardRemaining =
    phase === "done" && solvedDuringThis && turn.solves
      ? finalRemaining
      : remaining;

  return (
    <section ref={ref} className="sc-turn sc-visible">
      <div className="sc-turn-head">
        <span className="sc-turn-num">Turn {turn.n}</span>
        <span className="sc-turn-status">
          {phase === "thinking" && "— thinking"}
          {phase === "reasoning" && "— composing"}
          {phase === "selecting" && "— committing guess"}
          {phase === "reacting" &&
            (turn.result === "wrong" ? "— incorrect" : "— solved")}
          {phase === "done" &&
            (turn.result === "wrong" ? "— one away" : "— solved")}
        </span>
      </div>

      <SolvedRows ids={solvedIds} />
      <Board
        remaining={boardRemaining}
        selected={selected}
        wrongFlash={wrongFlash}
        fadingOut={fadingOut}
      />

      {showOneAway && <div className="sc-one-away">{turn.oneAway}</div>}

      <div className="sc-action-line">Thinking</div>
      <div className="sc-thinking">
        <span className="sc-thinking-dots">
          <span /><span /><span />
        </span>
        <span className="sc-thinking-label">{turn.thinking}</span>
      </div>

      {(phase === "reasoning" ||
        phase === "selecting" ||
        phase === "reacting" ||
        phase === "done") && (
        <>
          <div className="sc-action-line">Reasoning</div>
          <TypedReasoning
            key={turn.reasoning.map((s) => s.t).join(" ")}
            segments={turn.reasoning}
            onDone={handleReasoningDone}
          />
        </>
      )}

      {turn.autoResolve && phase === "done" && (
        <>
          <div className="sc-action-line" style={{ marginTop: 32 }}>
            Auto-resolve
          </div>
          <div className="sc-final-resolve">
            Four remain. The final group resolves on its own —{" "}
            <em>things that stain.</em>
          </div>
          {autoResolved && (
            <div style={{ marginTop: 20 }}>
              <SolvedRows ids={["stains"]} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── End card ────────────────────────────────────────────────────────
const END_LEADERBOARD = [
  { rk: "01", model: "claude-sonnet-4-6", score: 0.812, turns: 4.2, mist: 0.9, n: "1,280", self: true },
  { rk: "02", model: "gpt-5.1",            score: 0.774, turns: 4.5, mist: 1.1, n: "1,280" },
  { rk: "03", model: "gemini-3.0-pro",     score: 0.698, turns: 4.8, mist: 1.4, n: "1,280" },
  { rk: "04", model: "claude-haiku-4-5",   score: 0.612, turns: 5.3, mist: 1.9, n: "1,280" },
  { rk: "05", model: "gpt-4o",             score: 0.541, turns: 5.7, mist: 2.2, n: "960"   },
  { rk: "06", model: "gemini-2.0-flash",   score: 0.488, turns: 6.1, mist: 2.6, n: "960"   },
];

function EndCard() {
  return (
    <div className="sc-end-card">
      <span className="eyebrow eyebrow-leaf">— episode complete · field across the vow</span>
      <h2 style={{ marginTop: 24 }}>
        Solved in <em>four turns,</em> one mistake.
      </h2>
      <div className="sc-caption">
        you just watched · claude-sonnet-4-6 · seed 142 · 2.4s median / turn
      </div>

      <div className="sc-lb">
        <div className="sc-lb-head">
          <span>rk</span>
          <span>model</span>
          <span className="sc-lb-col-num">solve rate</span>
          <span className="sc-lb-col-num">avg turns</span>
          <span className="sc-lb-col-num">mistakes / ep</span>
          <span className="sc-lb-col-num">episodes</span>
        </div>
        {END_LEADERBOARD.map((r) => (
          <div
            key={r.rk}
            className={`sc-lb-row ${r.self ? "sc-lb-row-self" : ""}`}
          >
            <span className="sc-lb-rank">{r.rk}</span>
            <span className="sc-lb-model">
              {r.model}
              {r.self && <span className="sc-lb-self-tag">you watched</span>}
            </span>
            <span className="sc-lb-score sc-lb-col-num">{r.score.toFixed(3)}</span>
            <span className="sc-lb-col-num">{r.turns.toFixed(1)}</span>
            <span className="sc-lb-col-num">{r.mist.toFixed(1)}</span>
            <span className="sc-lb-col-num">{r.n}</span>
          </div>
        ))}
      </div>

      <div className="sc-lb-foot">
        <span>6 models · 6,720 episodes · 480 distinct puzzles · seeds 1–480</span>
        <span>refreshed 14:22 UTC · vow sealed 2026-02-11</span>
      </div>
    </div>
  );
}

// ── Demo shell ──────────────────────────────────────────────────────
export default function Connections() {
  const [revealed, setRevealed] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const handleTurnDone = (index: number) => {
    if (index + 1 >= TURNS.length) setAllDone(true);
    else setRevealed((r) => Math.max(r, index + 2));
  };

  return (
    <div>
      {revealed === 0 ? (
        <div className="text-center py-12">
          <button
            type="button"
            onClick={() => setRevealed(1)}
            className="sc-begin"
          >
            Begin the episode{" "}
            <span style={{ fontFamily: "var(--f-display)", fontStyle: "italic" }}>→</span>
          </button>
          <p className="mt-4 eyebrow">single episode · scroll-driven</p>
        </div>
      ) : (
        <p className="eyebrow text-center py-4">
          episode in progress · scroll continues below ↓
        </p>
      )}

      <div>
        {TURNS.slice(0, revealed).map((t, i) => (
          <TurnSection key={i} turn={t} index={i} onDone={handleTurnDone} />
        ))}
      </div>

      {allDone && <EndCard />}
    </div>
  );
}
