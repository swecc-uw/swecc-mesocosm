import { useState, type MouseEvent } from "react";
import { Btn } from "@/components/ds/Btn";
import { updateRunVisibility, type Run, type RunVisibility } from "@/lib/api";
import { benchAuthDisabled } from "@/lib/env";
import { useBenchAuth } from "@/hooks/useBenchAuth";

function isRunPublic(run: Run): boolean {
  return run.visibility !== "private";
}

function nextVisibility(run: Run): RunVisibility {
  return isRunPublic(run) ? "private" : "gallery_public";
}

interface Props {
  run: Run;
  /** Gallery-synthesized rows cannot be toggled. */
  galleryEntry?: boolean;
  onUpdated?: (run: Run) => void;
  className?: string;
}

export function RunVisibilityButton({
  run,
  galleryEntry = false,
  onUpdated,
  className = "",
}: Props) {
  const { benchMe } = useBenchAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canToggle =
    !galleryEntry &&
    run.requester_id !== "gallery" &&
    (benchAuthDisabled() || benchMe.type === "member");

  if (!canToggle) return null;

  const isPublic = isRunPublic(run);

  async function handleToggle(e: MouseEvent) {
    e.stopPropagation();
    setBusy(true);
    setError(null);
    try {
      const updated = await updateRunVisibility(run.id, nextVisibility(run));
      onUpdated?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update visibility");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`text-[10px] uppercase tracking-[0.14em] ${
          isPublic ? "text-leaf-deep" : "text-ink-3"
        }`}
        title={isPublic ? "Visible on the public gallery when completed" : "Only you (and your team) can see this run"}
      >
        {isPublic ? "public" : "private"}
      </span>
      <Btn
        variant="link"
        onClick={(e) => void handleToggle(e)}
        disabled={busy}
        className="text-[10px] uppercase tracking-[0.14em] px-0 h-auto text-ink-2 hover:text-leaf-deep"
      >
        {busy ? "Saving…" : isPublic ? "Make private" : "Make public"}
      </Btn>
      {error && (
        <span className="text-[10px] text-bad max-w-[12rem] truncate" title={error}>
          {error}
        </span>
      )}
    </span>
  );
}
