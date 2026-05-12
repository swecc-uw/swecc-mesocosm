/** Files in `public/` at runtime, with correct prefix for GitHub project Pages (`base`). */
export function publicAssetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/") return `/${normalized}`;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${normalized}`;
}
