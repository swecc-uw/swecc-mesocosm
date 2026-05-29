"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ── Stocks ──────────────────────────────────────────────────────────
const STARTING_CASH = 100_000;

interface Stock {
  sym: string;
  name: string;
  price: number;
  open: number;
  held: number;
}

const INITIAL_STOCKS: Record<string, Stock> = {
  NVDA: { sym: "NVDA", name: "NVIDIA",      price: 892.40, open: 892.40, held: 0 },
  AAPL: { sym: "AAPL", name: "Apple",       price: 214.75, open: 214.75, held: 0 },
  TSLA: { sym: "TSLA", name: "Tesla",       price: 248.12, open: 248.12, held: 0 },
  JPM:  { sym: "JPM",  name: "JPMorgan",    price: 206.30, open: 206.30, held: 0 },
  XOM:  { sym: "XOM",  name: "Exxon Mobil", price: 118.64, open: 118.64, held: 0 },
  COIN: { sym: "COIN", name: "Coinbase",    price:  92.85, open:  92.85, held: 0 },
};

type SegStyle = "plain" | "caps" | "em";
interface Segment { t: string; style: SegStyle }
interface NewsItem { t: string; src: string; tag: string; headline: string }

interface ActionLeaf {
  kind: "buy" | "sell" | "hold";
  sym: string;
  shares?: number;
  price?: number;
  then?: ActionLeaf;
}

interface PriceMove { sym: string; to: number }

interface Turn {
  n: string;
  time: string;
  thinking: string;
  newsPush: NewsItem[];
  reasoning: Segment[];
  action: ActionLeaf;
  priceMoves: PriceMove[];
  status: string;
}

// ── Turn script ─────────────────────────────────────────────────────
const TRADING_TURNS: Turn[] = [
  {
    n: "I.", time: "09:32", thinking: "Reading the tape on open",
    newsPush: [
      { t: "09:30", src: "Bloomberg", tag: "MKT",  headline: "Futures open flat — traders eye Nvidia earnings after bell, CPI print at 10am." },
      { t: "09:31", src: "Reuters",   tag: "NVDA", headline: "Nvidia cloud-GPU backlog lengthens to 14 months, Jefferies note says." },
    ],
    reasoning: [
      { t: "Two signals. The ", style: "plain" },
      { t: "NVDA", style: "caps" },
      { t: " backlog note is bullish going into tonight's print — ", style: "plain" },
      { t: "demand-supply imbalance rarely reverses in a day.", style: "em" },
      { t: " Sizing a core position before the CPI noise hits.", style: "plain" },
    ],
    action: { kind: "buy", sym: "NVDA", shares: 40, price: 892.40 },
    priceMoves: [{ sym: "NVDA", to: 901.20 }, { sym: "TSLA", to: 246.80 }],
    status: "+$352 mark-to-market",
  },
  {
    n: "II.", time: "10:04", thinking: "Reacting to the CPI print",
    newsPush: [
      { t: "10:00", src: "BLS",  tag: "MACRO", headline: "CPI comes in at 2.9% YoY vs. 3.1% expected — softest read in 14 months." },
      { t: "10:01", src: "CNBC", tag: "RATES", headline: "Fed-funds futures repricing: odds of a June cut jump from 38% → 62%." },
      { t: "10:02", src: "WSJ",  tag: "JPM",   headline: "Bank of America: softer inflation extends net-interest-margin compression for large banks." },
    ],
    reasoning: [
      { t: "Soft CPI is ", style: "plain" },
      { t: "risk-on", style: "em" },
      { t: ", but the same tape is bad for ", style: "plain" },
      { t: "JPM", style: "caps" },
      { t: ". I don't have a position there yet — ", style: "plain" },
      { t: "opening a short via reduced exposure: none to add.", style: "em" },
      { t: " Instead, rotating into ", style: "plain" },
      { t: "TSLA", style: "caps" },
      { t: " which benefits from a lower-rate regime and is down on the day.", style: "plain" },
    ],
    action: { kind: "buy", sym: "TSLA", shares: 120, price: 246.80 },
    priceMoves: [
      { sym: "TSLA", to: 253.40 }, { sym: "NVDA", to: 908.10 },
      { sym: "JPM",  to: 201.25 }, { sym: "XOM",  to: 116.90 },
    ],
    status: "+$1,144 mark-to-market",
  },
  {
    n: "III.", time: "11:47", thinking: "Midday — considering a fade",
    newsPush: [
      { t: "11:40", src: "Reuters",   tag: "ENERGY", headline: "OPEC+ signals extension of voluntary cuts through Q3 — crude jumps 2.1%." },
      { t: "11:44", src: "Bloomberg", tag: "COIN",   headline: "Coinbase files for EU MiCA license; shares up 5% premarket on institutional read." },
    ],
    reasoning: [
      { t: "OPEC headline is genuine — ", style: "plain" },
      { t: "XOM", style: "caps" },
      { t: " should follow crude. But I want to avoid piling into ", style: "plain" },
      { t: "three concurrent longs", style: "em" },
      { t: " without trimming winners. ", style: "plain" },
      { t: "Taking partial profits on NVDA and rotating into XOM.", style: "em" },
    ],
    action: {
      kind: "sell", sym: "NVDA", shares: 15, price: 908.10,
      then: { kind: "buy", sym: "XOM", shares: 100, price: 116.90 },
    },
    priceMoves: [
      { sym: "XOM",  to: 119.80 }, { sym: "NVDA", to: 905.40 },
      { sym: "TSLA", to: 255.10 }, { sym: "COIN", to:  97.50 },
    ],
    status: "+$1,921 mark-to-market",
  },
  {
    n: "IV.", time: "13:22", thinking: "Noise filter — choosing to hold",
    newsPush: [
      { t: "13:14", src: "X/Twitter", tag: "RUMOR", headline: "Unverified account claims Tesla recall on Model Y steering — no corroboration from regulators." },
      { t: "13:18", src: "Reuters",   tag: "TSLA",  headline: "NHTSA: no active investigation into Tesla steering, per spokesperson." },
    ],
    reasoning: [
      { t: "The rumor moved the tape for about 90 seconds before the Reuters clarification. ", style: "plain" },
      { t: "I do not trade unverified X posts", style: "em" },
      { t: " — especially when the underlying thesis (rate-cut rotation) is intact. ", style: "plain" },
      { t: "Holding TSLA.", style: "em" },
    ],
    action: { kind: "hold", sym: "TSLA" },
    priceMoves: [{ sym: "TSLA", to: 257.60 }, { sym: "NVDA", to: 911.00 }, { sym: "AAPL", to: 216.40 }],
    status: "+$2,304 mark-to-market",
  },
  {
    n: "V.", time: "15:48", thinking: "Positioning into the close",
    newsPush: [
      { t: "15:40", src: "Bloomberg", tag: "MKT",  headline: "VIX drops to 13.2 — lowest close in six weeks. Index adds lifted by rate-cut repricing." },
      { t: "15:45", src: "CNBC",      tag: "NVDA", headline: "Sell-side preview: Street whisper for NVDA data-center revenue is above consensus guide." },
    ],
    reasoning: [
      { t: "Earnings risk is asymmetric tonight — ", style: "plain" },
      { t: "consensus is already elevated", style: "em" },
      { t: ", so a beat may not drive meaningful upside, while a miss would gap down. ", style: "plain" },
      { t: "Trimming NVDA to half-size", style: "em" },
      { t: ", keeping TSLA and XOM unchanged, locking in the day.", style: "plain" },
    ],
    action: { kind: "sell", sym: "NVDA", shares: 12, price: 911.00 },
    priceMoves: [{ sym: "NVDA", to: 913.20 }, { sym: "TSLA", to: 258.80 }, { sym: "XOM", to: 120.45 }],
    status: "+$2,476 realized + unrealized",
  },
];

// ── Timeline / chart helpers ────────────────────────────────────────
const STEPS_PER_TURN = 5;

function seededWiggle(sym: string, turn: number, step: number): number {
  let h = 2166136261;
  const s = `${sym}:${turn}:${step}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 2000) - 1000) / 1000;
}

interface Point {
  step: number; t: string; price: number;
  isAction?: boolean; actionKind?: string; actionPrice?: number;
  isResolve?: boolean;
}
interface HoldInterval {
  entryStep: number; entryPrice: number; shares: number;
  exitStep: number; exitPrice: number; entryAvg: number;
  stillOpen?: boolean;
}
interface Timeline {
  series: Record<string, Point[]>;
  holdsBySym: Record<string, HoldInterval[]>;
  endStep: number;
}

function buildTimeline(turns: Turn[], initialStocks: Record<string, Stock>): Timeline {
  const series: Record<string, Point[]> = {};
  const lastPrice: Record<string, number> = {};
  const actionsBySym: Record<string, { kind: string; shares: number; price: number; step: number; turn: number }[]> = {};

  Object.keys(initialStocks).forEach((sym) => {
    series[sym] = [{ step: 0, t: "open", price: initialStocks[sym].open }];
    lastPrice[sym] = initialStocks[sym].open;
    actionsBySym[sym] = [];
  });

  turns.forEach((turn, ti) => {
    const turnBaseStep = 1 + ti * STEPS_PER_TURN;

    Object.keys(initialStocks).forEach((sym) => {
      const base = lastPrice[sym];
      const move = (turn.priceMoves || []).find((m) => m.sym === sym);
      const target = move ? move.to : base;

      for (let k = 0; k < STEPS_PER_TURN - 1; k++) {
        const t = (k + 1) / STEPS_PER_TURN;
        const interp = base + (target - base) * t;
        const amp = Math.abs(target - base) * 0.35 + base * 0.0015;
        const wig = seededWiggle(sym, ti, k) * amp;
        series[sym].push({
          step: turnBaseStep + k,
          t: "tick",
          price: Math.max(0.01, interp + wig),
        });
      }
      series[sym].push({
        step: turnBaseStep + STEPS_PER_TURN - 1,
        t: "resolve",
        price: target,
        isResolve: !!move,
      });
      lastPrice[sym] = target;
    });

    const actionStep = turnBaseStep + STEPS_PER_TURN - 2;
    const recordAction = (a?: ActionLeaf) => {
      if (!a || a.kind === "hold" || a.shares == null || a.price == null) return;
      actionsBySym[a.sym].push({
        kind: a.kind, shares: a.shares, price: a.price,
        step: actionStep, turn: ti,
      });
      const pts = series[a.sym];
      const marker = pts.find((p) => p.step === actionStep);
      if (marker) {
        marker.isAction = true;
        marker.actionKind = a.kind;
        marker.actionPrice = a.price;
      }
    };
    recordAction(turn.action);
    if (turn.action.then) recordAction(turn.action.then);
  });

  const endStep = turns.length * STEPS_PER_TURN;
  const holdsBySym: Record<string, HoldInterval[]> = {};
  Object.keys(actionsBySym).forEach((sym) => {
    holdsBySym[sym] = [];
    let openInterval: (Partial<HoldInterval> & { entryStep: number; entryPrice: number; shares: number }) | null = null;
    let position = 0;
    let totalCost = 0;
    actionsBySym[sym].forEach((a) => {
      if (a.kind === "buy") {
        if (position === 0) {
          openInterval = { entryStep: a.step, entryPrice: a.price, shares: a.shares };
          totalCost = a.price * a.shares;
        } else if (openInterval) {
          totalCost += a.price * a.shares;
          openInterval.shares += a.shares;
        }
        position += a.shares;
      } else if (a.kind === "sell") {
        position -= a.shares;
        if (position <= 0 && openInterval) {
          openInterval.exitStep = a.step;
          openInterval.exitPrice = a.price;
          openInterval.entryAvg = totalCost / openInterval.shares;
          holdsBySym[sym].push(openInterval as HoldInterval);
          openInterval = null;
          position = 0;
          totalCost = 0;
        }
      }
    });
    if (openInterval) {
      const oi = openInterval as Partial<HoldInterval> & { entryStep: number; entryPrice: number; shares: number };
      const pts = series[sym];
      const finalPrice = pts[pts.length - 1].price;
      oi.exitStep = endStep;
      oi.exitPrice = finalPrice;
      oi.entryAvg = totalCost / oi.shares;
      oi.stillOpen = true;
      holdsBySym[sym].push(oi as HoldInterval);
    }
  });

  return { series, holdsBySym, endStep };
}

const TIMELINE = buildTimeline(TRADING_TURNS, INITIAL_STOCKS);

// ── PriceChart ──────────────────────────────────────────────────────
function PriceChart({
  sym, upToStep, holds = [], holdsVisible = false,
  width = 320, height = 110, showAxis = true,
}: {
  sym: string;
  upToStep?: number;
  holds?: HoldInterval[];
  holdsVisible?: boolean;
  width?: number;
  height?: number;
  showAxis?: boolean;
}) {
  const all = TIMELINE.series[sym] || [];
  const pts = upToStep != null ? all.filter((p) => p.step <= upToStep) : all;
  if (pts.length === 0) return null;

  const prices = pts.map((p) => p.price);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  if (min === max) { min *= 0.98; max *= 1.02; }
  const pad = (max - min) * 0.12;
  min -= pad; max += pad;

  const xMin = 0;
  const xMax = TIMELINE.endStep;
  const PAD_L = showAxis ? 44 : 10;
  const PAD_R = 10, PAD_T = 10, PAD_B = showAxis ? 22 : 10;
  const innerW = width - PAD_L - PAD_R;
  const innerH = height - PAD_T - PAD_B;
  const xOf = (step: number) => PAD_L + ((step - xMin) / (xMax - xMin)) * innerW;
  const yOf = (price: number) => PAD_T + (1 - (price - min) / (max - min)) * innerH;
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.step).toFixed(1)} ${yOf(p.price).toFixed(1)}`).join(" ");
  const trend = pts[pts.length - 1].price >= pts[0].price ? "up" : "down";

  const turnLines: number[] = [];
  for (let ti = 1; ti <= TRADING_TURNS.length; ti++) turnLines.push(ti * STEPS_PER_TURN);

  const activeHolds = holdsVisible ? holds : [];
  const last = pts[pts.length - 1].price;

  return (
    <svg
      className={`sc-tr-chart sc-tr-chart-${trend}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
    >
      {activeHolds.map((h, i) => {
        const x1 = xOf(h.entryStep);
        const x2 = xOf(h.exitStep);
        const profit = h.exitPrice >= h.entryAvg;
        return (
          <g key={i}>
            <rect
              x={x1} y={PAD_T} width={x2 - x1} height={innerH}
              className={`sc-tr-hold-rect ${profit ? "" : "loss"}`}
            />
            <line x1={x1} x2={x1} y1={PAD_T} y2={PAD_T + innerH} className="sc-tr-hold-edge" />
            <line x1={x2} x2={x2} y1={PAD_T} y2={PAD_T + innerH} className="sc-tr-hold-edge" />
          </g>
        );
      })}
      {turnLines.map((s, i) => (
        <line
          key={i}
          x1={xOf(s)} x2={xOf(s)}
          y1={PAD_T} y2={PAD_T + innerH}
          className="sc-tr-grid-v"
        />
      ))}
      {showAxis && (
        <>
          <text x={PAD_L - 6} y={PAD_T + 4} className="sc-tr-axis-tick" textAnchor="end">
            ${max.toFixed(max > 100 ? 0 : 2)}
          </text>
          <text x={PAD_L - 6} y={PAD_T + innerH} className="sc-tr-axis-tick" textAnchor="end">
            ${min.toFixed(min > 100 ? 0 : 2)}
          </text>
        </>
      )}
      <path d={path} className="sc-tr-chart-line" fill="none" />
      {pts.filter((p) => p.isAction).map((p, i) => (
        <circle
          key={i}
          cx={xOf(p.step)} cy={yOf(p.price)} r={4}
          className={`sc-tr-action-dot sc-tr-action-dot-${p.actionKind || "hold"}`}
        />
      ))}
      <circle
        cx={xOf(pts[pts.length - 1].step)}
        cy={yOf(pts[pts.length - 1].price)}
        r={3.5}
        className="sc-tr-now-dot"
      />
      {showAxis && (
        <text x={PAD_L} y={height - 6} className="sc-tr-axis-label">
          {sym} · ${last.toFixed(2)}
        </text>
      )}
    </svg>
  );
}

// ── Typed reasoning ─────────────────────────────────────────────────
function TypedReasoning({
  segments, onDone,
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
    let delay = 14;
    if (ch === " ") delay = 8;
    if (/[.,—]/.test(ch)) delay = 110;
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
    <div className="sc-tr-reasoning">
      {visible.map((v, i) => {
        if (v.style === "em") return <em key={i}>{v.t}</em>;
        if (v.style === "caps") return <span key={i} className="sc-word-caps">{v.t}</span>;
        return <span key={i}>{v.t}</span>;
      })}
      <span className="sc-caret" />
    </div>
  );
}

// ── Portfolio panel ─────────────────────────────────────────────────
function PortfolioPanel({
  cash, stocks, totalValue, pnl,
}: {
  cash: number;
  stocks: Record<string, Stock>;
  totalValue: number;
  pnl: number;
}) {
  const held = Object.values(stocks).filter((s) => s.held > 0);
  const pnlClass = pnl > 0 ? "up" : pnl < 0 ? "down" : "";
  const pnlPct = (pnl / STARTING_CASH) * 100;

  return (
    <aside className="sc-tr-portfolio">
      <div className="sc-tr-panel-head">
        <span className="eyebrow eyebrow-leaf">— portfolio</span>
        <span className="sc-tr-clock">LIVE</span>
      </div>
      <div>
        <div className="sc-tr-pv-label">total value</div>
        <div className="sc-tr-pv-value">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`sc-tr-pv-pnl ${pnlClass}`}>
          {pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="sc-tr-pv-pct">{pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</span>
        </div>
      </div>
      <div className="sc-tr-divider" />
      <div className="sc-tr-cash-row">
        <span className="sc-tr-k">cash</span>
        <span className="sc-tr-v">
          ${cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div>
        <div className="sc-tr-holdings-head">
          <span>holdings</span>
          <span>{held.length} / 6</span>
        </div>
        {held.length === 0 && (
          <div className="sc-tr-holdings-empty">— no positions yet</div>
        )}
        {held.map((s) => {
          const change = (s.price - s.open) / s.open;
          const val = s.held * s.price;
          return (
            <div key={s.sym} className="sc-tr-hold-row">
              <div className="sc-tr-hold-l">
                <span className="sc-tr-sym">{s.sym}</span>
                <span className="sc-tr-shares">{s.held} sh</span>
              </div>
              <div className="sc-tr-hold-r">
                <span className="sc-tr-hold-val">
                  ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className={`sc-tr-hold-chg ${change >= 0 ? "up" : "down"}`}>
                  {change >= 0 ? "+" : ""}{(change * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sc-tr-divider" />
      <div className="sc-tr-watchlist-head">watchlist</div>
      <div className="sc-tr-watchlist">
        {Object.values(stocks).map((s) => {
          const change = (s.price - s.open) / s.open;
          return (
            <div key={s.sym} className="sc-tr-wl-row">
              <span className="sc-tr-sym">{s.sym}</span>
              <span className="sc-tr-wl-price">${s.price.toFixed(2)}</span>
              <span className={`sc-tr-wl-chg ${change >= 0 ? "up" : "down"}`}>
                {change >= 0 ? "▲" : "▼"} {Math.abs(change * 100).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ── News feed ───────────────────────────────────────────────────────
function NewsFeed({ items }: { items: NewsItem[] }) {
  return (
    <aside className="sc-tr-news">
      <div className="sc-tr-panel-head">
        <span className="eyebrow eyebrow-leaf">— news wire</span>
        <span className="sc-tr-clock sc-tr-clock-live"><span className="sc-tr-dot" />LIVE</span>
      </div>
      {items.length === 0 && (
        <div className="sc-tr-news-empty">
          <div className="sc-tr-news-empty-mark">◌</div>
          <div>Market not yet open.<br />Wire will stream here.</div>
        </div>
      )}
      <div className="sc-tr-news-stream">
        {items.map((item, i) => (
          <div key={i} className="sc-tr-news-item" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="sc-tr-news-meta">
              <span className="sc-tr-news-time">{item.t}</span>
              <span className={`sc-tr-news-tag sc-tr-tag-${item.tag.toLowerCase()}`}>{item.tag}</span>
              <span className="sc-tr-news-src">{item.src}</span>
            </div>
            <div className="sc-tr-news-headline">{item.headline}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── A single turn ───────────────────────────────────────────────────
type TurnPhase = "news" | "thinking" | "reasoning" | "acting" | "resolving" | "done";
type TurnEvent =
  | { event: "news"; turn: number; news: NewsItem[] }
  | { event: "trade"; turn: number; action: ActionLeaf }
  | { event: "prices"; turn: number; moves: PriceMove[] }
  | { event: "complete"; turn: number };

function TradingTurn({
  turn, index, onEvent,
}: {
  turn: Turn;
  index: number;
  onEvent: (e: TurnEvent) => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState<TurnPhase>("news");
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  const fired = useRef({ news: false, trade: false, prices: false, complete: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (phase === "news") {
      if (!fired.current.news) {
        fired.current.news = true;
        onEventRef.current({ event: "news", turn: index, news: turn.newsPush });
      }
      const id = setTimeout(() => setPhase("thinking"), 1400);
      return () => clearTimeout(id);
    }
    if (phase === "thinking") {
      const id = setTimeout(() => setPhase("reasoning"), 1200);
      return () => clearTimeout(id);
    }
    if (phase === "acting") {
      if (!fired.current.trade) {
        fired.current.trade = true;
        onEventRef.current({ event: "trade", turn: index, action: turn.action });
      }
      const id = setTimeout(() => setPhase("resolving"), 1100);
      return () => clearTimeout(id);
    }
    if (phase === "resolving") {
      if (!fired.current.prices) {
        fired.current.prices = true;
        onEventRef.current({ event: "prices", turn: index, moves: turn.priceMoves });
      }
      const id = setTimeout(() => setPhase("done"), 1400);
      return () => clearTimeout(id);
    }
    if (phase === "done") {
      const id = setTimeout(() => {
        if (!fired.current.complete) {
          fired.current.complete = true;
          onEventRef.current({ event: "complete", turn: index });
        }
      }, 900);
      return () => clearTimeout(id);
    }
  }, [phase, index, turn]);

  const renderActionDetail = (a: ActionLeaf) => {
    if (a.kind === "hold") {
      return (
        <div className="sc-tr-action sc-tr-action-hold">
          <span className="sc-tr-action-kind">HOLD</span>
          <span className="sc-tr-action-detail">{a.sym} · no change</span>
        </div>
      );
    }
    const notional = (a.shares ?? 0) * (a.price ?? 0);
    const cls = a.kind === "buy" ? "sc-tr-action-buy" : "sc-tr-action-sell";
    const kind = a.kind.toUpperCase();
    return (
      <div className={`sc-tr-action ${cls}`}>
        <span className="sc-tr-action-kind">{kind}</span>
        <span className="sc-tr-action-detail">
          {a.shares} sh <strong>{a.sym}</strong> @ ${a.price?.toFixed(2)}
          <span className="sc-tr-action-notional"> · ${notional.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </span>
      </div>
    );
  };

  const involved = useMemo(() => {
    const set = new Set<string>();
    set.add(turn.action.sym);
    if (turn.action.then) set.add(turn.action.then.sym);
    return Array.from(set);
  }, [turn]);

  return (
    <section ref={ref} className="sc-tr-turn sc-visible">
      <div className="sc-tr-turn-head">
        <div>
          <span className="sc-tr-turn-num">Turn {turn.n}</span>
          <span className="sc-tr-turn-time">{turn.time}</span>
        </div>
        <span className="sc-tr-turn-status">
          {phase === "news"      && "— news in"}
          {phase === "thinking"  && "— thinking"}
          {phase === "reasoning" && "— composing"}
          {phase === "acting"    && "— submitting order"}
          {phase === "resolving" && "— market moves"}
          {phase === "done"      && `— ${turn.status}`}
        </span>
      </div>

      {phase !== "news" && (
        <>
          <div className="sc-action-line">Thinking</div>
          <div className="sc-thinking">
            <span className="sc-thinking-dots"><span /><span /><span /></span>
            <span className="sc-thinking-label">{turn.thinking}</span>
          </div>
        </>
      )}

      {(phase === "reasoning" || phase === "acting" || phase === "resolving" || phase === "done") && (
        <>
          <div className="sc-action-line">Reasoning</div>
          <TypedReasoning
            segments={turn.reasoning}
            onDone={() => { if (phase === "reasoning") setPhase("acting"); }}
          />
        </>
      )}

      {(phase === "acting" || phase === "resolving" || phase === "done") && (
        <>
          <div className="sc-action-line">Order</div>
          <div className="sc-tr-actions">
            {renderActionDetail(turn.action)}
            {turn.action.then && renderActionDetail(turn.action.then)}
          </div>
        </>
      )}

      {(phase === "resolving" || phase === "done") && turn.priceMoves.length > 0 && (
        <>
          <div className="sc-action-line">Tape</div>
          <div className="sc-tr-tape">
            {turn.priceMoves.map((m, i) => (
              <div key={i} className="sc-tr-tape-row" style={{ animationDelay: `${i * 0.15}s` }}>
                <span className="sc-tr-sym">{m.sym}</span>
                <span className="sc-tr-tape-arrow">→</span>
                <span className="sc-tr-tape-price">${m.to.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {(phase === "resolving" || phase === "done") && involved.length > 0 && (
        <>
          <div className="sc-action-line">Chart</div>
          <div className="sc-tr-turn-charts">
            {involved.map((sym) => (
              <div key={sym} className="sc-tr-chart-wrap">
                <PriceChart sym={sym} upToStep={(index + 1) * STEPS_PER_TURN} />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ── End-card recap ──────────────────────────────────────────────────
const END_LB = [
  { rk: "01", model: "claude-sonnet-4-6", score: "+1.42%", sharpe: "2.11",  dd: "-3.8%",  n: "480", self: true },
  { rk: "02", model: "gpt-5.1",            score: "+1.18%", sharpe: "1.87",  dd: "-4.2%",  n: "480" },
  { rk: "03", model: "gemini-3.0-pro",     score: "+0.93%", sharpe: "1.52",  dd: "-5.1%",  n: "480" },
  { rk: "04", model: "claude-haiku-4-5",   score: "+0.61%", sharpe: "1.08",  dd: "-6.4%",  n: "480" },
  { rk: "05", model: "gpt-4o",             score: "+0.22%", sharpe: "0.45",  dd: "-8.7%",  n: "360" },
  { rk: "06", model: "gemini-2.0-flash",   score: "-0.14%", sharpe: "-0.18", dd: "-11.2%", n: "360" },
];

function EndCard() {
  const recapSyms = ["NVDA", "TSLA", "XOM"];
  return (
    <div className="sc-end-card">
      <span className="eyebrow eyebrow-leaf">— session complete · field across the vow</span>
      <h2>Closed the day <em>up $2,476,</em> 2.48%.</h2>
      <div className="sc-caption">
        you just watched · claude-sonnet-4-6 · seed 042 · 1 ignored rumor · 4 trades placed
      </div>

      <div className="sc-tr-recap">
        <div className="sc-tr-recap-head">
          <span className="eyebrow eyebrow-leaf">— trade recap</span>
          <span className="sc-tr-recap-meta">shaded = held interval</span>
        </div>
        <div className="sc-tr-recap-grid">
          {recapSyms.map((sym) => {
            const holds = TIMELINE.holdsBySym[sym] || [];
            if (holds.length === 0) return null;
            const h = holds[0];
            const pnlPerShare = h.exitPrice - h.entryAvg;
            const pnlTotal = pnlPerShare * h.shares;
            const pnlPct = (pnlPerShare / h.entryAvg) * 100;
            const profit = pnlTotal >= 0;
            return (
              <div key={sym} className="sc-tr-recap-card">
                <div className="sc-tr-recap-top">
                  <div className="sc-tr-recap-sym">{sym}</div>
                  <div className={`sc-tr-recap-pnl ${profit ? "up" : "down"}`}>
                    {profit ? "+" : ""}${pnlTotal.toFixed(0)}
                    <span className="sc-tr-recap-pct">
                      {profit ? "+" : ""}{pnlPct.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <PriceChart sym={sym} holds={holds} holdsVisible width={360} height={140} />
                <div className="sc-tr-recap-meta-row">
                  <span>
                    <span className="k">entry</span> ${h.entryAvg.toFixed(2)} · {h.shares} sh
                  </span>
                  <span>
                    <span className="k">exit</span> ${h.exitPrice.toFixed(2)}
                    {h.stillOpen && <span className="sc-tr-still-open"> (carried to close)</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sc-lb">
        <div className="sc-lb-head">
          <span>rk</span>
          <span>model</span>
          <span className="sc-lb-col-num">avg daily return</span>
          <span className="sc-lb-col-num">sharpe</span>
          <span className="sc-lb-col-num">max drawdown</span>
          <span className="sc-lb-col-num">sessions</span>
        </div>
        {END_LB.map((r) => (
          <div key={r.rk} className={`sc-lb-row ${r.self ? "sc-lb-row-self" : ""}`}>
            <span className="sc-lb-rank">{r.rk}</span>
            <span className="sc-lb-model">
              {r.model}
              {r.self && <span className="sc-lb-self-tag">you watched</span>}
            </span>
            <span className="sc-lb-score sc-lb-col-num">{r.score}</span>
            <span className="sc-lb-col-num">{r.sharpe}</span>
            <span className="sc-lb-col-num">{r.dd}</span>
            <span className="sc-lb-col-num">{r.n}</span>
          </div>
        ))}
      </div>
      <div className="sc-lb-foot">
        <span>6 models · 2,640 sessions · 120 distinct market days · seeds 1–120</span>
        <span>refreshed 14:22 UTC · vow sealed 2026-02-11</span>
      </div>
    </div>
  );
}

// ── Trading shell ───────────────────────────────────────────────────
export default function Trading() {
  const [revealed, setRevealed] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [cash, setCash] = useState(STARTING_CASH);
  const [stocks, setStocks] = useState<Record<string, Stock>>(
    () => JSON.parse(JSON.stringify(INITIAL_STOCKS)),
  );
  const [news, setNews] = useState<NewsItem[]>([]);

  const totalValue =
    cash + Object.values(stocks).reduce((acc, s) => acc + s.held * s.price, 0);
  const pnl = totalValue - STARTING_CASH;

  const handleEvent = (evt: TurnEvent) => {
    if (evt.event === "news") {
      setNews((prev) => [...evt.news.slice().reverse(), ...prev]);
    } else if (evt.event === "trade") {
      const a = evt.action;
      if (a.kind === "hold") return;
      const applyOne = (
        op: ActionLeaf,
        state: Record<string, Stock>,
        curCash: number,
      ): { state: Record<string, Stock>; cash: number } => {
        if (op.kind === "buy" && op.shares != null && op.price != null) {
          const cost = op.shares * op.price;
          const ns = { ...state };
          ns[op.sym] = { ...ns[op.sym], held: ns[op.sym].held + op.shares };
          return { state: ns, cash: curCash - cost };
        }
        if (op.kind === "sell" && op.shares != null && op.price != null) {
          const proceeds = op.shares * op.price;
          const ns = { ...state };
          ns[op.sym] = { ...ns[op.sym], held: Math.max(0, ns[op.sym].held - op.shares) };
          return { state: ns, cash: curCash + proceeds };
        }
        return { state, cash: curCash };
      };
      setStocks((prev) => {
        let curCash = cash;
        let curState = prev;
        const r1 = applyOne(a, curState, curCash);
        curState = r1.state; curCash = r1.cash;
        if (a.then) {
          const r2 = applyOne(a.then, curState, curCash);
          curState = r2.state; curCash = r2.cash;
        }
        setTimeout(() => setCash(curCash), 0);
        return curState;
      });
    } else if (evt.event === "prices") {
      setStocks((prev) => {
        const ns = { ...prev };
        evt.moves.forEach((m) => {
          if (ns[m.sym]) ns[m.sym] = { ...ns[m.sym], price: m.to };
        });
        return ns;
      });
    } else if (evt.event === "complete") {
      if (evt.turn + 1 >= TRADING_TURNS.length) setAllDone(true);
      else setRevealed((r) => Math.max(r, evt.turn + 2));
    }
  };

  if (revealed === 0) {
    return (
      <div className="text-center py-12">
        <button type="button" onClick={() => setRevealed(1)} className="sc-begin">
          Open the floor{" "}
          <span style={{ fontFamily: "var(--f-display)", fontStyle: "italic" }}>→</span>
        </button>
        <p className="mt-4 eyebrow">$100k bankroll · five decisions · 6.5h session</p>
      </div>
    );
  }

  return (
    <>
      <div className="sc-tr-stage">
        <PortfolioPanel cash={cash} stocks={stocks} totalValue={totalValue} pnl={pnl} />
        <div className="sc-tr-body">
          {TRADING_TURNS.slice(0, revealed).map((t, i) => (
            <TradingTurn key={i} turn={t} index={i} onEvent={handleEvent} />
          ))}
        </div>
        <NewsFeed items={news} />
      </div>
      {allDone && <EndCard />}
    </>
  );
}
