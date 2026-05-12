import Link from "next/link";
import {
  Domain,
  LeaderboardEntry,
  AnySpace,
  isCompositeSpace,
  SpaceSpec,
} from "@/lib/api";
import {
  Plaque,
  PlaquePlate,
  PlaqueBody,
  PlaqueMetricStrip,
} from "@/components/ds/Plaque";
import { Sigil } from "@/components/ds/Sigil";
import { Btn } from "@/components/ds/Btn";

interface Props {
  domain: Domain;
  leaderboard?: LeaderboardEntry[];
  runs7d?: number;
}

const TIER_ROMAN: Record<string, string> = { tier1: "i.", tier2: "ii." };
const RANK_ROMAN = ["i", "ii", "iii"];

// ── Contract chip helpers ──────────────────────────────────────────
function spaceLabel(s: AnySpace): string {
  if (isCompositeSpace(s)) return "composite";
  return (s as SpaceSpec).type;
}

function actionLabel(s: AnySpace): string {
  const base = spaceLabel(s);
  if (!isCompositeSpace(s)) {
    const sp = s as SpaceSpec;
    if (sp.enum_values && sp.enum_values.length > 0) {
      return `${base}[${sp.enum_values.length}]`;
    }
  }
  return base;
}

function ContractChip({ vow }: { vow: Domain["binding_vow"] }) {
  const obs = spaceLabel(vow.observation_space);
  const act = actionLabel(vow.action_space);
  const rew = vow.reward.type;
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-3 border-y border-line text-[11px] uppercase tracking-[0.16em] font-medium text-ink-2 [font-family:var(--f-body)]">
      <span>{obs}</span>
      <span className="text-ink-3">→</span>
      <span>{act}</span>
      <span className="text-ink-3">→</span>
      <span>{rew}</span>
    </div>
  );
}

// ── Status / tier / mode chips ─────────────────────────────────────
function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "muted" | "leaf";
}) {
  const cls =
    tone === "leaf"
      ? "bg-leaf-tint text-leaf-deep"
      : tone === "muted"
        ? "bg-paper-3 text-ink-3"
        : "border border-line text-ink-2";
  return (
    <span
      className={`inline-flex items-center px-2 h-5 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

// ── Mini-leaderboard ───────────────────────────────────────────────
function MiniLeaderboard({
  entries,
  primaryMetric,
}: {
  entries: LeaderboardEntry[];
  primaryMetric: string;
}) {
  if (entries.length === 0) {
    return (
      <Link
        href="#"
        className="block py-3 border-t border-line text-center italic [font-family:var(--f-display)] text-ink-2 hover:text-leaf-deep transition-colors"
      >
        be the first to bench
      </Link>
    );
  }
  return (
    <div className="border-t border-line">
      {entries.slice(0, 3).map((e, i) => (
        <div
          key={e.run_id}
          className={`grid grid-cols-[24px_1fr_auto] items-baseline gap-3 px-3 py-1.5 ${i > 0 ? "border-t border-line" : ""}`}
        >
          <span className="num-old text-base text-ink-3">{RANK_ROMAN[i]}</span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-2 truncate">
            {e.model}
          </span>
          <span className="num-old text-base text-ink">
            {e.primary_score.toFixed(3)}
          </span>
        </div>
      ))}
      <div className="px-3 py-1 border-t border-line eyebrow text-right">
        primary · {primaryMetric}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────
export default function PracticalPlaque({
  domain,
  leaderboard = [],
  runs7d,
}: Props) {
  const isPublished = domain.status === "published";
  const isInDev = domain.status === "draft" || domain.status === "testing";
  const top = leaderboard[0]?.primary_score;
  const modelsTracked = new Set(leaderboard.map((e) => e.model)).size;

  return (
    <Plaque className={`${isInDev ? "opacity-90" : ""}`}>
      {/* 1. Eyebrow row */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-line">
        <span className="[font-family:var(--f-display)] italic text-ink-2 text-sm">
          {TIER_ROMAN[domain.binding_vow.tier] ?? "i."}{" "}
          <span className="text-ink">{domain.owner_id}</span>
        </span>
        <span>
          {domain.has_gold_benchmark ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 h-5 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium border"
              style={{
                color: "oklch(0.55 0.13 80)",
                borderColor: "oklch(0.78 0.13 80)",
                background: "oklch(0.97 0.04 80)",
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: "oklch(0.65 0.16 80)" }}
              />
              gold benchmark
            </span>
          ) : !isPublished ? (
            <Chip tone="muted">{domain.status}</Chip>
          ) : null}
        </span>
      </div>

      {/* 2. Plate — sigil + binding-vow contract chip */}
      <PlaquePlate className="!py-5 flex-col gap-3">
        <Sigil id={domain.id} size={64} />
      </PlaquePlate>
      <ContractChip vow={domain.binding_vow} />

      <PlaqueBody className="!gap-2">
        {/* 3. Title */}
        <h3
          className="text-2xl font-medium leading-tight text-ink [font-family:var(--f-display)]"
          style={{ letterSpacing: "-0.012em" }}
        >
          {domain.name}
        </h3>

        {/* 4. Owner line */}
        <div className="text-[11px] text-muted">
          {domain.owner_id} · v{domain.binding_vow.version}
        </div>

        {/* 5. One-liner */}
        {domain.detail && (
          <p
            className="text-[12.5px] text-ink-2 line-clamp-2 leading-snug"
            style={{ fontFamily: "var(--f-body)" }}
          >
            {domain.detail}
          </p>
        )}

        {/* 6. Tag row */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          <Chip tone="leaf">{domain.binding_vow.tier}</Chip>
          <Chip>{domain.endpoint.mode}</Chip>
          {domain.tags.slice(0, 3).map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </PlaqueBody>

      {/* 7. Mini-leaderboard */}
      <MiniLeaderboard
        entries={isPublished ? leaderboard : []}
        primaryMetric={domain.scoring.primary_metric}
      />

      {/* 8. Three-figure metric strip */}
      {isPublished ? (
        <PlaqueMetricStrip
          items={[
            { label: "top score", value: top != null ? top.toFixed(3) : "—" },
            {
              label: "runs · 7d",
              value: runs7d != null ? runs7d : leaderboard.length,
            },
            { label: "models", value: modelsTracked || "—" },
          ]}
        />
      ) : (
        <PlaqueMetricStrip
          items={[
            { label: "status", value: <span className="text-ink-3">draft</span> },
            { label: "runs · 7d", value: <span className="text-ink-3">n/a</span> },
            { label: "models", value: <span className="text-ink-3">n/a</span> },
          ]}
        />
      )}

      {/* 9. CTA row */}
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-line">
        {isInDev ? (
          <span /> /* spacer; no Start CTA in dev */
        ) : (
          <Btn href={`/domains/${domain.id}#run`} variant="primary">
            Start a run <span aria-hidden>→</span>
          </Btn>
        )}
        <Btn href={`/domains/${domain.id}`} variant="link">
          Read the vow <span aria-hidden>→</span>
        </Btn>
      </div>
    </Plaque>
  );
}
