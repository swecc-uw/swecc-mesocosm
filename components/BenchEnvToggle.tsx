"use client";

export type Mode = "bench" | "env";

interface BenchEnvToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export default function BenchEnvToggle({ mode, onChange }: BenchEnvToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-line bg-paper-2 p-1 gap-1">
      {(["bench", "env"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-5 py-1 rounded-full text-xs uppercase tracking-[0.16em] font-medium transition-colors ${
            mode === m
              ? "bg-ink text-paper dark:bg-leaf-deep"
              : "text-ink-2 hover:text-ink"
          }`}
        >
          {m === "bench" ? "Bench" : "Env"}
        </button>
      ))}
    </div>
  );
}
