"use client";

import { useEffect, useRef } from "react";
import { Domain, LeaderboardEntry } from "@/lib/api";
import PracticalPlaque from "@/components/PracticalPlaque";
import { Btn } from "@/components/ds/Btn";

interface Props {
  domains: Domain[];
  leaderboards: Record<string, LeaderboardEntry[]>;
  allTags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  totalFilteredCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore?: boolean;
}

export default function PracticalGallery({
  domains,
  leaderboards,
  allTags,
  activeTag,
  onTagChange,
  totalFilteredCount,
  hasMore,
  onLoadMore,
  loadingMore = false,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "120px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <>
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-8">
          <TagButton
            label="all"
            active={activeTag === null}
            onClick={() => onTagChange(null)}
          />
          {allTags.map((t) => (
            <TagButton
              key={t}
              label={t}
              active={activeTag === t}
              onClick={() => onTagChange(activeTag === t ? null : t)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((d) => (
          <PracticalPlaque
            key={d.id}
            domain={d}
            leaderboard={leaderboards[d.id] ?? []}
          />
        ))}
      </div>

      {domains.length === 0 && totalFilteredCount === 0 && activeTag && (
        <div className="py-32 text-center">
          <p className="[font-family:var(--f-display)] italic text-ink-2 text-2xl">
            no exhibits match that tag
          </p>
        </div>
      )}

      {hasMore && (
        <div className="mt-10 flex flex-col items-center gap-4">
          <Btn
            variant="ghost"
            onClick={onLoadMore}
            disabled={loadingMore}
            className={loadingMore ? "opacity-50 cursor-not-allowed" : ""}
          >
            {loadingMore ? "Loading exhibits…" : "Load more exhibits"}
            <span aria-hidden>→</span>
          </Btn>
          <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
        </div>
      )}

      <p className="mt-10 eyebrow text-center">
        Showing {domains.length} of {totalFilteredCount}{" "}
        {totalFilteredCount === 1 ? "exhibit" : "exhibits"}
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
