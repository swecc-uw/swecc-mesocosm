/**
 * Bench API base URL.
 *
 * Local dev: bench-api in swecc-core's docker-compose binds to host port
 * `BENCH_API_PORT` (default 8010) — port 8000 is taken by swecc-server.
 * Production: a `bench.swecc.org` reverse proxy in swecc-core/infra/gateway
 * fronts the same container.
 *
 * Override either with `VITE_PUBLIC_API_BASE` (or alias `VITE_PUBLIC_API_URL`)
 * in `.env.local` for dev, or via the `ENV_FILE` GitHub Actions secret for
 * Pages deploys.
 */
function readApiBase(): string {
  const fromEnv =
    import.meta.env.VITE_PUBLIC_API_BASE ?? import.meta.env.VITE_PUBLIC_API_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  return "http://localhost:8010";
}

export const API_BASE = readApiBase();
