import { Link } from "react-router-dom";
import { useActiveTeam } from "@/hooks/useActiveTeam";
import { benchAuthDisabled } from "@/lib/env";

interface SubmittingAsBannerProps {
  /** Shorter copy for tight layouts (e.g. exhibit run panel). */
  compact?: boolean;
}

/**
 * Shows whether new bench runs / dev env submissions go to the member solo or a team.
 */
export function SubmittingAsBanner({ compact = false }: SubmittingAsBannerProps) {
  const { team, clearTeam } = useActiveTeam();

  if (benchAuthDisabled() || compact) return null;

  if (!team) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line rounded-[2px] px-3 py-2 bg-paper-2">
        <p className="text-sm text-ink leading-relaxed">
          <span className="eyebrow mr-2">submitting as</span>
          <strong>you (solo)</strong>
          <span className="text-ink-2">
            {" "}
            — runs and developer submissions are credited to you only.
          </span>
        </p>
        <Link
          to="/account#teams"
          className="text-xs uppercase tracking-[0.14em] text-ink-2 hover:text-ink shrink-0"
        >
          Switch to team
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex ${compact ? "flex-col gap-2" : "flex-wrap items-center justify-between gap-3"} border border-leaf-deep/30 rounded-[2px] px-3 py-2 bg-leaf-tint/40`}
    >
      <p className={`${compact ? "text-xs" : "text-sm"} text-ink leading-relaxed`}>
        <span className="eyebrow eyebrow-leaf mr-2">submitting as</span>
        <strong>{team.name}</strong>
        {!compact && (
          <span className="text-ink-2">
            {" "}
            — new runs and developer submissions are saved to this team&apos;s roster.
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={clearTeam}
        className="text-xs uppercase tracking-[0.14em] text-ink-2 hover:text-ink shrink-0"
      >
        Switch to solo
      </button>
    </div>
  );
}
