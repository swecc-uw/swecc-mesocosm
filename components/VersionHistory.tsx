"use client";

import { useState } from "react";
import { VersionEntry } from "@/lib/api";

interface VersionHistoryProps {
  entries: VersionEntry[];
  currentVersion: string;
}

export default function VersionHistory({ entries, currentVersion }: VersionHistoryProps) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-ink-3">
        No version history recorded yet. Current vow:{" "}
        <span className="num-tab text-ink">v{currentVersion}</span>
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors"
      >
        <span
          className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
        version history · {entries.length}
      </button>

      {open && (
        <ol className="mt-4 relative border-l border-line ml-2 space-y-5 pl-5">
          {entries.map((entry, idx) => (
            <li key={idx} className="relative">
              <span className="absolute -left-[6px] top-1.5 w-2.5 h-2.5 rounded-full bg-paper border border-line" />
              <div className="flex items-baseline gap-3">
                <span className="num-old text-lg text-leaf-deep">
                  v{entry.version}
                </span>
                <span className="text-xs text-ink-3 num-tab">{entry.date}</span>
              </div>
              <p className="mt-1 text-sm text-ink-2">{entry.changes}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
