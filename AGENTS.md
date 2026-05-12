<!-- BEGIN:spa-agent-rules -->
# Vite + React (SPA)

This UI is a **Vite** single-page app with **React Router**. Use `npm run dev` / `npm run build` / `npm run preview`. Client env vars must be prefixed with `VITE_` (see `src/lib/env.ts`).

**GitHub Pages:** `base` for production comes from **`package.json` → `homepage`** (or **`VITE_BASE_PATH`**). `npm run dev` forces **`base: '/'`** so localhost stays simple. Match `homepage` to the real public URL (e.g. `https://org.github.io/repo/`).
<!-- END:spa-agent-rules -->
