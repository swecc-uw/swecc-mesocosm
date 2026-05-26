/** Solo vs team attribution badge for runs and developer environments. */
export function ScopePill({
  teamId,
  teamName,
}: {
  teamId?: string | null;
  teamName?: string | null;
}) {
  const isTeam = Boolean(teamId);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.14em] font-medium shrink-0 ${
        isTeam
          ? "bg-leaf-tint text-leaf-deep border border-leaf/20"
          : "bg-paper-2 text-ink-3 border border-line"
      }`}
    >
      {isTeam ? teamName?.trim() || "Team" : "Solo"}
    </span>
  );
}
