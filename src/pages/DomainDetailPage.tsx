import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import DomainDetailClient from "@/components/DomainDetailClient";
import { getDomain, getLeaderboard, type Domain, type LeaderboardEntry } from "@/lib/api";

export function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ domain: Domain; leaderboard: LeaderboardEntry[] } | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const domain = await getDomain(id);
        let leaderboard: LeaderboardEntry[] = [];
        try {
          leaderboard = await getLeaderboard(id);
        } catch {
          leaderboard = [];
        }
        if (!cancelled) setData({ domain, leaderboard });
      } catch {
        if (!cancelled) setMissing(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (data?.domain.name) {
      document.title = `${data.domain.name} — Mesocosm`;
    }
  }, [data?.domain.name]);

  if (missing) return <Navigate to="/404" replace />;
  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center text-ink-2 text-sm">
        Loading…
      </div>
    );
  }

  return <DomainDetailClient domain={data.domain} leaderboard={data.leaderboard} />;
}
