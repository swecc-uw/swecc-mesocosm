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

  if (benchAuthDisabled()) return null;

  if (!team) {
    if (compact) return null;
    return (
      <p className="text-xs text-ink-3 border border-line rounded-[2px] px-3 py-2 bg-paper-2">
        Submitting as <strong className="text-ink">you (solo)</strong> — not on a team roster.{" "}
        <Link to="/account#teams" className="text-leaf-deep underline underline-offset-2">
          Join or create a team
        </Link>{" "}
        to credit work to a group.
      </p>
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
