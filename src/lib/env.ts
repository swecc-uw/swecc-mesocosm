/**
 * Bench API base URL.
 *
 * Production: api.swecc.org nginx routes `/bench/` → bench-api.
 * Local dev: set `VITE_PUBLIC_API_BASE` in `.env.local` (see `.env.example`).
 *
 * Override with `VITE_PUBLIC_API_BASE` (or alias `VITE_PUBLIC_API_URL`), or
 * the `ENV_FILE` GitHub Actions secret for Pages deploys.
 */
const PRODUCTION_API_BASE = "https://api.swecc.org/bench";

function readApiBase(): string {
  const fromEnv =
    import.meta.env.VITE_PUBLIC_API_BASE ?? import.meta.env.VITE_PUBLIC_API_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  return PRODUCTION_API_BASE;
}

export const API_BASE = readApiBase();
