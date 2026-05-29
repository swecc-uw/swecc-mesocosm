import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Domain,
  LeaderboardEntry,
  getLeaderboard,
  listDomains,
} from "@/lib/api";

const INITIAL_VISIBLE = 9;
const LOAD_MORE_STEP = 9;
/** Home exhibit cards only show top 3; avoid fetching full leaderboards. */
const HOME_LEADERBOARD_LIMIT = 3;

export function useHomeGallery() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [activeTag, setActiveTagState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await listDomains({ publishedOnly: true });
        if (!cancelled) {
          setDomains(next);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setDomains([]);
          setError(e instanceof Error ? e.message : "Failed to load exhibits");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const d of domains) d.tags.forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [domains]);

  const filteredDomains = useMemo(
    () =>
      activeTag
        ? domains.filter((d) => d.tags.includes(activeTag))
        : domains,
    [domains, activeTag],
  );

  const visibleDomains = useMemo(
    () => filteredDomains.slice(0, visibleCount),
    [filteredDomains, visibleCount],
  );

  const totalFilteredCount = filteredDomains.length;
  const hasMore = visibleCount < totalFilteredCount;

  const leaderboardsLoading = visibleDomains.some(
    (d) => leaderboards[d.id] === undefined,
  );

  const setActiveTag = useCallback((tag: string | null) => {
    setActiveTagState(tag);
    setVisibleCount(INITIAL_VISIBLE);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + LOAD_MORE_STEP, filteredDomains.length));
  }, [filteredDomains.length]);

  const visibleIdsKey = visibleDomains.map((d) => d.id).join(",");

  useEffect(() => {
    const idsNeedingLb = visibleDomains
      .map((d) => d.id)
      .filter((id) => leaderboards[id] === undefined);
    if (idsNeedingLb.length === 0) return;

    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        idsNeedingLb.map(async (id) => {
          try {
            const entries = await getLeaderboard(id, HOME_LEADERBOARD_LIMIT);
            return [id, entries] as const;
          } catch {
            return [id, [] as LeaderboardEntry[]] as const;
          }
        }),
      );
      if (cancelled) return;
      setLeaderboards((prev) => {
        const next = { ...prev };
        for (const [id, entries] of pairs) next[id] = entries;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [visibleIdsKey, visibleDomains, leaderboards]);

  return {
    domains,
    loading,
    error,
    leaderboards,
    leaderboardsLoading,
    allTags,
    activeTag,
    setActiveTag,
    visibleDomains,
    totalFilteredCount,
    totalCount: domains.length,
    visibleCount: visibleDomains.length,
    hasMore,
    loadMore,
  };
}
