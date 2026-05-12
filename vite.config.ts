import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(
  readFileSync(path.join(__dirname, "package.json"), "utf8"),
) as { homepage?: string };

/**
 * When `VITE_BASE_PATH` is unset, infer from `package.json` → `homepage`:
 * - `https://user.github.io/repo` → `/repo/` (project Pages)
 * - `https://example.com` (no path) → `/`
 *
 * `npm run dev` always uses `base: '/'` so http://localhost:5173/ works; build/preview use the path above.
 */
function inferBaseFromHomepage(): string {
  const hp = pkg.homepage?.trim();
  if (!hp) return "/";
  try {
    const u = new URL(hp);
    if (u.hostname.endsWith(".github.io")) {
      const segments = u.pathname.split("/").filter(Boolean);
      if (segments.length >= 1) return `/${segments[0]}/`;
      return "/";
    }
    const p = u.pathname.replace(/\/+$/, "");
    if (!p) return "/";
    return p.endsWith("/") ? p : `${p}/`;
  } catch {
    return "/";
  }
}

export function viteBase(): string {
  const raw = process.env.VITE_BASE_PATH?.trim();
  if (raw) {
    if (raw === "/") return "/";
    return raw.endsWith("/") ? raw : `${raw}/`;
  }
  return inferBaseFromHomepage();
}

/** Local dev at `/`; production build + `vite preview` match GitHub Pages URL. */
function resolvedBase(): string {
  if (process.env.npm_lifecycle_event === "dev") return "/";
  return viteBase();
}

function hashRouterBootPlugin(): Plugin {
  return {
    name: "mesocosm-hash-router-boot",
    apply: "build",
    transformIndexHtml(html, ctx) {
      if (ctx.server) return html;
      const base = viteBase();
      if (base === "/") return html;
      // If user opens …/repo/ or …/repo with no hash, HashRouter never sees a route — force #/
      const boot = `(function(){var h=location.hash;if(h&&h.length>1&&h.charAt(1)==="/")return;var p=location.pathname.replace(/\\/index\\.html$/i,"");if(p.slice(-1)!=="/")p+="/";location.replace(p+location.search+"#/");})();`;
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {},
            children: boot,
            injectTo: "head",
          },
        ],
      };
    },
  };
}

export default defineConfig({
  base: resolvedBase(),
  plugins: [react(), hashRouterBootPlugin()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
