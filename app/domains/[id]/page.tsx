import { getDomain, getLeaderboard, LeaderboardEntry } from "@/lib/api";
import { notFound } from "next/navigation";
import DomainDetailClient from "@/components/DomainDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function DomainDetailPage({ params }: PageProps) {
  const { id } = await params;

  let leaderboard: LeaderboardEntry[] = [];
  try {
    const domain = await getDomain(id);
    try {
      leaderboard = await getLeaderboard(id);
    } catch {
      leaderboard = [];
    }
    return <DomainDetailClient domain={domain} leaderboard={leaderboard} />;
  } catch {
    notFound();
  }
}
