# Mesocosm UI

Vite + React + TypeScript SPA. Frontend for **BenchAnything** — the bench backend lives in the [`swecc-core`](https://github.com/swecc-uw/swecc-core) monorepo under `services/bench/`.

## Getting started

The UI talks to the `bench-api` FastAPI service from the swecc-core monorepo. Bring it up first:

```bash
cd /path/to/swecc-core
cp .env.example .env   # add ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY etc.
docker compose up bench-api bench-sandbox
```

`bench-api` listens on `http://localhost:8010` by default (port `8000` is taken by `swecc-server`; the host port comes from `BENCH_API_PORT` in swecc-core's `.env`).

Then from this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Registered domains appear on the home page; click a card for detail.

**Run replay** (public for gallery runs): `/runs/{run_id}` — step-by-step model reasoning export from `GET /v1/runs/{id}/export`. Environment authors use `bench run export` to build showcase UIs in their own repos (see swecc-core `services/bench/docs/SHOWCASE_DEVELOPER.md`).

### Environment

Create `.env.local` (optional) — Vite only exposes variables prefixed with `VITE_`:

```bash
# default (matches BENCH_API_PORT=8010 in swecc-core's .env)
VITE_PUBLIC_API_BASE=http://localhost:8010
```

(`VITE_PUBLIC_API_URL` is accepted as an alias.) See `.env.example` for the full list. For CI / GitHub Actions deploys, populate the **`ENV_FILE`** repo secret as described in the swecc SPA template — its contents are written to `.env.local` before the production build.

In production, point at the path-based prod URL on `api.swecc.org`:

```bash
VITE_PUBLIC_API_BASE=https://api.swecc.org/bench
```

bench-api is mounted under `/bench/` on the same gateway that serves the Django backend — no separate subdomain or cert is needed. The bench-api side already ships permissive CORS (`allow_origins=["*"]`), so the SPA on `swecc-uw.github.io` (or wherever it's hosted) can talk to it directly.

### MCP server

The `bench-anything` MCP server (over **Streamable HTTP**) lives in swecc-core at `services/mcp/`. Once `mcp-host` is brought up there:

```bash
docker compose up mcp-host
# local (no nginx):  http://localhost:8009/bench-anything/mcp
# local (with-nginx profile):  http://localhost/mcp/bench-anything/mcp
# production:                  https://api.swecc.org/mcp/bench-anything/mcp
```

Any MCP-capable harness (Cursor, Claude Code, Continue, custom agent) can connect by URL — no need to spawn a local subprocess. Point its `BENCH_ANYTHING_BASE_URL` env at whichever bench-api you want it to drive (the local `http://swecc-bench-api:8000` inside the compose network, or `https://api.swecc.org/bench` from outside).

### GitHub Pages

The site is set up for **project Pages**: `https://swecc-uw.github.io/swecc-mesocosm/`.

- **`package.json` → `homepage`** must stay the real public URL. Vite infers **`base`** from it for **`npm run build`** and **`npm run preview`**. CI does not need to set anything unless you override with an Actions variable **`VITE_BASE_PATH`**.
- **`npm run dev`** always uses **`base: '/'`**, so you open **http://localhost:5173/** (not the `/swecc-mesocosm/` path).
- **Production** with that project URL uses **hash routing** (`…/swecc-mesocosm/#/…`) so the static host never has to rewrite paths; local dev still uses normal paths.

**Blank tab title only:** wrong `base` vs URL (fix `homepage` or `VITE_BASE_PATH`).

**Later (custom domain at `/`):** change `homepage` to that URL (e.g. `https://mesocosm.swecc.org`) or set **`VITE_BASE_PATH=/`**, then redeploy — the app switches back to **BrowserRouter** (no `#` in URLs).

After `npm run build`, **`404.html`** is copied from **`index.html`** so refreshing deep routes works on Pages.

## Scripts

| Command            | Description           |
| ------------------ | --------------------- |
| `npm run dev`      | Vite dev server       |
| `npm run build`    | `tsc` + production build → `dist/` |
| `npm run preview`  | Preview production build |
| `npm run lint`     | ESLint                |
| `npm run spellcheck` | cspell              |
