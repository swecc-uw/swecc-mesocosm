"use client";

import { useMemo, useState } from "react";
import { Domain, LeaderboardEntry } from "@/lib/api";
import PracticalPlaque from "@/components/PracticalPlaque";

interface Props {
  domains: Domain[];
  leaderboards: Record<string, LeaderboardEntry[]>;
}

export default function PracticalGallery({ domains, leaderboards }: Props) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const d of domains) d.tags.forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [domains]);

  const filtered = activeTag
    ? domains.filter((d) => d.tags.includes(activeTag))
    : domains;

  return (
    <>
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-8">
          <TagButton
            label="all"
            active={activeTag === null}
            onClick={() => setActiveTag(null)}
          />
          {allTags.map((t) => (
            <TagButton
              key={t}
              label={t}
              active={activeTag === t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((d) => (
          <PracticalPlaque
            key={d.id}
            domain={d}
            leaderboard={leaderboards[d.id] ?? []}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-32 text-center">
          <p className="[font-family:var(--f-display)] italic text-ink-2 text-2xl">
            no exhibits match that tag
          </p>
        </div>
      )}

      <p className="mt-10 eyebrow text-center">
        {filtered.length} {filtered.length === 1 ? "exhibit" : "exhibits"}
        {activeTag ? ` · filter: ${activeTag}` : ""}
      </p>
    </>
  );
}

function TagButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-2.5 h-6 rounded-full text-[10px] uppercase tracking-[0.16em] font-medium transition-colors ${
        active
          ? "bg-ink text-paper dark:bg-leaf-deep"
          : "border border-line text-ink-2 hover:border-ink hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
