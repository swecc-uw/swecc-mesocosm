# Mesocosm UI

Vite + React + TypeScript SPA (aligned with [swecc-spa-template](https://github.com/swecc-uw/swecc-spa-template) conventions: `npm run dev` / `build` / `lint` / `spellcheck`, GitHub Actions for PR dry-build and Pages deploy).

## Getting started

The UI reads domains from the BenchAnything API (default `http://127.0.0.1:8000`). Start the API from the **monorepo root** first:

```bash
cd ..   # repo root
uv run uvicorn src.api.app:app --reload
```

Then from this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Registered domains appear on the home page; click a card for detail.

### Environment

Create `.env.local` (optional). Vite only exposes variables prefixed with `VITE_`:

```bash
VITE_PUBLIC_API_BASE=http://127.0.0.1:8000
```

(`VITE_PUBLIC_API_URL` is accepted as an alias.) For CI/GitHub Actions, use the `ENV_FILE` secret as in the swecc SPA template.

### GitHub Pages

If the site is served from a **project** URL (`https://<user>.github.io/<repo>/`), set `base` in `vite.config.ts` to `'/<repo>/'` before building. For a custom domain at the root (e.g. `mesocosm.swecc.org`), keep `base: '/'` (default).

## Scripts

| Command            | Description           |
| ------------------ | --------------------- |
| `npm run dev`      | Vite dev server       |
| `npm run build`    | `tsc` + production build → `dist/` |
| `npm run preview`  | Preview production build |
| `npm run lint`     | ESLint                |
| `npm run spellcheck` | cspell              |
