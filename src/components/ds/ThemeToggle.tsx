"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const initial =
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark"
        | null) ?? "light";
    queueMicrotask(() => setTheme(initial));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("ba-theme", theme);
    } catch {
      // ignore quota / privacy mode
    }
  }, [theme]);

  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      title={`${next} mode`}
      onClick={() => setTheme(next)}
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-line text-ink-2 hover:border-ink hover:text-ink transition-colors"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M3 13 C 3 7, 7 3, 13 3 C 13 9, 9 13, 3 13 Z"
          fill={theme === "dark" ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path d="M3 13 L 13 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M3 13 L 1.5 14.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </button>
  );
}
