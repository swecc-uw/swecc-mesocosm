import type { RunExport, TraceEventJson, ReplayTurn } from "@/types/runExport";

export type Cell = "" | "X" | "O";

export interface TttBoardData {
  board: Cell[];
  message?: string;
  role?: string;
  valid_actions?: number[];
  moves_used?: number;
  moves_remaining?: number;
}

export interface TraceFrame {
  id: string;
  step: number;
  kind:
    | "start"
    | "before_agent"
    | "reasoning"
    | "action"
    | "step_result"
    | "after_env"
    | "episode_end";
  board?: Cell[];
  message?: string;
  reasoning?: string;
  action?: unknown;
  reward?: number;
  terminated?: boolean;
  info?: Record<string, string>;
  model?: string;
}

function observationSortKey(ev: TraceEventJson): number {
  const phase = obsPhase(ev);
  if (phase === "start") return 0;
  if (phase === "before_agent") return 1;
  if (phase === "after_env") return 5;
  return 1;
}

function eventSortKey(ev: TraceEventJson): number {
  if (ev.event_type === "observation") return observationSortKey(ev);
  const order: Record<string, number> = {
    episode_start: 0,
    model_call: 2,
    action: 3,
    tool_call: 3,
    technique_event: 3,
    step_result: 4,
    reward: 4,
    episode_end: 99,
  };
  return order[ev.event_type] ?? 50;
}

function obsPhase(ev: TraceEventJson): string {
  const p = ev.payload?.phase;
  if (typeof p === "string") return p;
  return ev.step === 0 ? "start" : "before_agent";
}

function boardFromData(data: unknown): TttBoardData | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const raw = d.board;
  if (!Array.isArray(raw) || raw.length !== 9) return null;
  const board = raw.map((c) => {
    const s = String(c ?? "").trim().toUpperCase();
    if (s === "X") return "X";
    if (s === "O") return "O";
    return "" as Cell;
  }) as Cell[];
  return {
    board,
    message: typeof d.message === "string" ? d.message : undefined,
    role: typeof d.role === "string" ? d.role : undefined,
    valid_actions: Array.isArray(d.valid_actions)
      ? (d.valid_actions as number[])
      : undefined,
    moves_used: typeof d.moves_used === "number" ? d.moves_used : undefined,
    moves_remaining:
      typeof d.moves_remaining === "number" ? d.moves_remaining : undefined,
  };
}

function sortEvents(events: TraceEventJson[]): TraceEventJson[] {
  return [...events].sort((a, b) => {
    if (a.step !== b.step) return a.step - b.step;
    const oa = eventSortKey(a);
    const ob = eventSortKey(b);
    if (oa !== ob) return oa - ob;
    return a.event_type.localeCompare(b.event_type);
  });
}

/** Build UI frames strictly from exported trace events (no simulated moves). */
export function buildFramesFromExport(exportData: RunExport): TraceFrame[] {
  const episodeId = exportData.episodes[0]?.id;
  if (!episodeId) return [];

  const events = sortEvents(exportData.traces[episodeId] ?? []);
  const frames: TraceFrame[] = [];
  let frameIdx = 0;

  for (const ev of events) {
    if (ev.event_type === "episode_start") continue;

    if (ev.event_type === "observation") {
      const phase = obsPhase(ev);
      const parsed = boardFromData(ev.payload?.data);
      if (!parsed) continue;
      frames.push({
        id: `f-${frameIdx++}`,
        step: ev.step,
        kind: phase === "after_env" ? "after_env" : phase === "start" ? "start" : "before_agent",
        board: parsed.board,
        message: parsed.message,
      });
      continue;
    }

    if (ev.event_type === "model_call") {
      const text = String(ev.payload?.text ?? "").trim();
      if (!text) continue;
      frames.push({
        id: `f-${frameIdx++}`,
        step: ev.step,
        kind: "reasoning",
        reasoning: text,
        model: typeof ev.payload?.model === "string" ? ev.payload.model : undefined,
      });
      continue;
    }

    if (ev.event_type === "action") {
      frames.push({
        id: `f-${frameIdx++}`,
        step: ev.step,
        kind: "action",
        action: ev.payload?.action,
      });
      continue;
    }

    if (ev.event_type === "step_result") {
      frames.push({
        id: `f-${frameIdx++}`,
        step: ev.step,
        kind: "step_result",
        reward: Number(ev.payload?.reward ?? 0),
        terminated: Boolean(ev.payload?.terminated),
        info: (ev.payload?.info as Record<string, string>) ?? {},
      });
      continue;
    }

    if (ev.event_type === "episode_end") {
      frames.push({
        id: `f-${frameIdx++}`,
        step: ev.step,
        kind: "episode_end",
        message: "Episode complete.",
      });
    }
  }

  return frames;
}

export function hasRecordedBoardStates(exportData: RunExport): boolean {
  const episodeId = exportData.episodes[0]?.id;
  if (!episodeId) return false;
  return (exportData.traces[episodeId] ?? []).some(
    (e) => e.event_type === "observation" && obsPhase(e) === "after_env",
  );
}

export function replayTurns(exportData: RunExport): ReplayTurn[] {
  const episodeId = exportData.episodes[0]?.id;
  return episodeId ? exportData.replay[episodeId] ?? [] : [];
}
