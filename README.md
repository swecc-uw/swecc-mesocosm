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
