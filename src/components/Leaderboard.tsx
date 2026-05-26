"use client";

import { LeaderboardEntry } from "@/lib/api";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  primaryMetric: string;
  higherIsBetter: boolean;
}

const RANK_ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
function rankLabel(idx: number): string {
  return RANK_ROMAN[idx] ?? `${idx + 1}`;
}

export default function Leaderboard({
  entries,
  primaryMetric,
  higherIsBetter,
}: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="border border-line rounded-[2px] py-16 text-center bg-paper-2">
        <p className="[font-family:var(--f-display)] italic text-2xl text-ink-2">
          no benchmarks yet.
        </p>
        <p className="mt-2 text-sm text-ink-3 max-w-xs mx-auto">
          Be the first to bench a model against this domain and claim a spot on the field.
        </p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    const diff = b.primary_score - a.primary_score;
    return higherIsBetter ? diff : -diff;
  });

  const scrollRuns = sorted.length > 5;

  return (
    <div className="border border-line rounded-[2px] overflow-hidden bg-paper">
      <div
        className={scrollRuns ? "max-h-[17.5rem] overflow-y-auto overscroll-y-contain" : undefined}
      >
      <table className="w-full text-sm">
        <thead className={scrollRuns ? "sticky top-0 z-10" : undefined}>
          <tr className="bg-paper-2 border-b border-line">
            <th className="text-left px-5 py-2.5 eyebrow w-12">rank</th>
            <th className="text-left px-5 py-2.5 eyebrow">model</th>
            <th className="text-left px-5 py-2.5 eyebrow">vow</th>
            <th className="text-right px-5 py-2.5 eyebrow">episodes</th>
            <th className="text-right px-5 py-2.5 eyebrow">{primaryMetric}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, idx) => (
            <tr
              key={entry.run_id}
              className="border-b border-line last:border-0 transition-colors hover:bg-paper-2"
            >
              <td className="px-5 py-3 num-old text-lg text-ink-3">
                {rankLabel(idx)}
              </td>
              <td className="px-5 py-3 font-medium text-ink">{entry.model}</td>
              <td className="px-5 py-3 text-ink-3 text-xs num-tab">
                v{entry.binding_vow_version}
              </td>
              <td className="px-5 py-3 text-right text-ink-2 num-tab">
                {entry.num_episodes}
              </td>
              <td className="px-5 py-3 text-right num-old text-lg text-ink">
                {entry.primary_score.toFixed(3)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
